"use client";

/** Only one preview video plays at a time across the page. */
let current: HTMLVideoElement | null = null;

export function playExclusive(video: HTMLVideoElement) {
  if (current && current !== video) current.pause();
  current = video;
  const promise = video.play();
  if (promise) promise.catch(() => {});
}

export function pauseVideo(video: HTMLVideoElement) {
  video.pause();
  if (current === video) current = null;
}
