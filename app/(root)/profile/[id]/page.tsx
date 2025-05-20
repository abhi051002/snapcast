import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";
import { dummyCards } from "@/constants";
import React from "react";

const page = async () => {
  // const page = async ({ params }: ParamsWithSearch) => {
  return (
    <div className="wrapper page">
      <Header
        subHeader="abhijitnanda@gmail.com"
        title="Abhijit Nanda"
        userImg="/assets/images/dummy.jpg"
      />
      <section className="video-grid">
        {dummyCards.map((card) => (
          <VideoCard key={card.id} {...card} />
        ))}{" "}
      </section>
    </div>
  );
};

export default page;
