import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";
import { getAllVideos } from "@/lib/actions/video";
import React from "react";

const Page = async ({ searchParams }: SearchParams) => {
  const { query, filter, page } = await searchParams;

  const { videos } = await getAllVideos(query, filter, Number(page) || 1);

  return (
    <main className="wrapper page">
      <Header subHeader="Public Library" title="All Videos" />
      {/* <h1 className="text-2xl font-karla">Welcome to Snap Cast</h1> */}
      {/* <section className="video-grid"> */}
      {videos?.length > 0 ? (
        <section className="video-grid">
          {videos.map(({ video, user }) => (
            <VideoCard
              key={video.id}
              {...video}
              userImg={user?.image || ""}
              username={user?.name || "Guest"}
              thumbnail={video.thumbnailUrl}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon="/assets/icons/video.svg"
          title="No Videos Found"
          description="Try Adjusting your search"
        />
      )}
      {/* </section> */}
    </main>
  );
};

export default Page;
