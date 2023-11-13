import currency from "currency-formatter";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { addTocart } from "../../redux/actions/cart";
import styles from "../../styles/styles";
import CountDown from "./CountDown";

const EventCard = ({ active, data }) => {
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const addToCartHandler = (data) => {
    const isItemExists = cart && cart.find((i) => i._id === data._id);
    if (isItemExists) {
      toast.error("Item already in cart!");
    } else {
      if (data.stock < 1) {
        toast.error("Product stock limited!");
      } else {
        const cartData = { ...data, qty: 1 };
        dispatch(addTocart(cartData));
        toast.success("Item added to cart successfully!");
      }
    }
  };
  return (
    <div
      className={`w-full block bg-white rounded-lg border-double border-4 border-sky-500 ${
        active ? "unset" : "mb-12"
      } lg:flex p-2`}
    >
      <div className="w-[30%] h-[30%] p-3 lg:-w[30%] m-auto">
        <img src={`${data.images[0]}`} alt="" />
      </div>
      <div className="w-full lg:[w-50%] flex flex-col justify-center">
        <h2 className={`${styles.productTitle}`}>{data.name}</h2>
        {/* <p>{data.description}</p> */}
        {data.description.length > 200 ? (
          <p
            dangerouslySetInnerHTML={{
              __html: data.description.slice(0, 400) + "...",
            }}
          ></p>
        ) : (
          <p dangerouslySetInnerHTML={{ __html: data.description }}></p>
        )}
        {/* <p dangerouslySetInnerHTML={{ __html: data.description }}></p> */}

        <div className="flex py-2 justify-between">
          <div className="flex">
            <h5 className="font-[500] text-[18px] text-[#d55b45] pr-3 line-through">
              {`${currency.format(data.originalPrice, { code: "VND" })}`}
            </h5>
            <h5 className="font-bold text-[20px] text-[#333] font-Roboto">
              {`${currency.format(data.discountPrice, { code: "VND" })}`}
            </h5>
          </div>
          <span className="pr-3 font-[400] text-[17px] text-[#44a55e]">
            {data.sold_out} sold
          </span>
        </div>
        <CountDown data={data} />
        <br />
        <div className="flex items-center">
          {/* <Link to={`/product/${data._id}?isEvent=true`}> */}
          <Link to={`/event/${data._id}`}>
            <div className={`${styles.button} text-[#fff]`}>Xem chi tiết</div>
          </Link>
          {/* <div className={`${styles.button} text-[#fff] ml-5`} onClick={() => addToCartHandler(data)}>Add to cart</div> */}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
