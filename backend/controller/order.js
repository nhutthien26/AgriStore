const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");

// create new order

// router.post(
//   "/create-order",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { cart, shippingAddress, user, totalPrice, shipping, paymentInfo } =
//         req.body;

//       //   group cart items by shopId
//       const shopItemsMap = new Map();

//       for (const item of cart) {
//         const shopId = item.shopId;
//         if (!shopItemsMap.has(shopId)) {
//           shopItemsMap.set(shopId, []);
//         }
//         shopItemsMap.get(shopId).push(item);
//       }

//       // create an order for each shop
//       const orders = [];

//       for (const [shopId, items] of shopItemsMap) {
//         const order = await Order.create({
//           cart: items,
//           shippingAddress,
//           user,
//           totalPrice,
//           shipping,
//           paymentInfo,
//         });
//         orders.push(order);
//       }

//       res.status(201).json({
//         success: true,
//         orders,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );
router.post(
  "/create-order",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { cart, shippingAddress, user, totalPrice, shipping, shopTotal, paymentInfo } =
        req.body;

      //   group cart items by shopId
      const shopItemsMap = new Map();

      for (const item of cart) {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      }

      // create an order for each shop
      const orders = [];

      for (const [shopId, items] of shopItemsMap) {
        const order = await Order.create({
          cart: items,
          shippingAddress,
          user,
          totalPrice,
          shipping,
          shopTotal,
          paymentInfo,
        });
        orders.push(order);
      }

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// get all orders of user
router.get(
  "/get-all-orders/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all orders of seller
router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({
        "cart.shopId": req.params.shopId,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update order status for seller
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(
          new ErrorHandler("Đơn hàng không tìm thấy với ID này", 400)
        );
      }
      if (req.body.status === "Transferred to delivery partner") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }

      order.status = req.body.status;

      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
        const serviceCharge = order.totalPrice * 0.05;
        await updateSellerInfo(order.totalPrice - serviceCharge);
      }

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
      });

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock -= qty;
        product.sold_out += qty;

        await product.save({ validateBeforeSave: false });
      }

      async function updateSellerInfo(amount) {
        const seller = await Shop.findById(req.seller.id);

        seller.availableBalance += amount;

        await seller.save();
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update order status for seller

// give a refund ----- user
router.put(
  "/order-refund/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(
          new ErrorHandler("Đơn hàng không tìm thấy với ID này", 400)
        );
      }

      order.status = req.body.status;

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
        message: "Yêu cầu hoàn tiền đặt hàng thành công!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// accept the refund ---- seller
// router.put(
//   "/order-refund-success/:id",
//   isSeller,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const order = await Order.findById(req.params.id);

//       if (!order) {
//         return next(
//           new ErrorHandler("Không tìm thấy đơn đặt hàng với id này", 400)
//         );
//       }

//       order.status = req.body.status;

//       await order.save();

//       res.status(200).json({
//         success: true,
//         message: "Hoàn tiền đặt hàng thành công!",
//       });

//       if (req.body.status === "Refund Success") {
//         order.cart.forEach(async (o) => {
//           await updateOrder(o._id, o.qty);
//         });
//       }

//       async function updateOrder(id, qty) {
//         const product = await Product.findById(id);

//         product.stock += qty;
//         product.sold_out -= qty;

//         await product.save({ validateBeforeSave: false });
//       }
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// accept the refund ---- seller
router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(
          new ErrorHandler("Không tìm thấy đơn đặt hàng với id này", 400)
        );
      }

      // Kiểm tra trạng thái của đơn hàng
      // if (order.status !== "Refund Success") {
      //   return next(
      //     new ErrorHandler(
      //       "Đơn hàng không ở trạng thái hoàn tiền thành công",
      //       400
      //     )
      //   );
      // }

      order.status = req.body.status;

      await order.save();

      res.status(200).json({
        success: true,
        message: "Hoàn tiền đặt hàng thành công!",
      });

      // Tính toán và trừ số tiền hoàn tiền khỏi doanh thu của cửa hàng
      const refundAmount = order.totalPrice;
      await updateSellerInfo(-refundAmount);

      // Hàm cập nhật thông tin cửa hàng
      async function updateSellerInfo(amount) {
        const seller = await Shop.findById(req.seller.id);

        // Trừ số tiền hoàn tiền khỏi doanh thu của cửa hàng
        seller.availableBalance += amount;

        // Lưu thông tin cửa hàng sau khi cập nhật
        await seller.save();
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all orders --- for admin
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/get-order/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId);

      if (!order) {
        return next(new ErrorHandler("Order not found with this ID", 404));
      }

      // Check if the user has the permission to access this order
      if (
        req.user.role !== "Admin" &&
        (req.user.role !== "Seller" || order.cart[0].seller.toString() !== req.user.id)
      ) {
        return next(new ErrorHandler("Unauthorized access to this order", 403));
      }

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
