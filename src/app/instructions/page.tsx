"use client";
import { api } from "~/trpc/server";
import { useState } from "react";
import Image from "next/image";
import React from "react";
import ImageTapper from "../_components/imageTapper";

export default function InstructionsPage() {

  return (
    <ImageTapper images={[
      `/instructions/image1.png`,
      `/instructions/image2.png`,
      `/instructions/image3.png`,
      `/instructions/image4.png`,
    ]} text={[
        "Find a parcel to modify.", 
        "Choose whether to start fresh or build upon an existing build.", 
        "Envision your ideal multi-unit home.", 
        "Share with your friends and community!"]} />
  );
}