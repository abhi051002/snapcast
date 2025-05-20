import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";
import { dummyCards } from "@/constants";
import React from "react";

const Page = () => {
  return (
    <main className="wrapper page">
      <Header subHeader="Public Library" title="All Videos" />
      <h1 className="text-2xl font-karla">Welcome to Snap Cast</h1>
      <section className="video-grid">
        {dummyCards.map((card) => (
          <VideoCard key={card.id} {...card} />
        ))}{" "}
      </section>
    </main>
  );
};

export default Page;
