"use client";
import { useState } from "react";
import Progress from "./Progress";
import styles from "../styles/MultiStepHome.module.css";
import { ethers } from "ethers";
import EventDetails from "./eventCreation/steps/EventDetails";
import Location from "./eventCreation/steps/Location";
import Tickets from "./eventCreation/steps/Tickets";
import DateTime from "./eventCreation/steps/DateTime";
import { EventData } from "./eventCreation/types";
import { error } from "console";

const totalSteps = 4;

export type Token = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
};

interface MultiStepProps {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  preview: string | null;
  setPreview: React.Dispatch<React.SetStateAction<string | null>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleTokenChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  tokenOptions: Token[];
  createEvent: () => Promise<void>;
}

export function MultiStep({
  eventData,
  setEventData,
  file,
  setFile,
  preview,
  setPreview,
  error,
  setError,
  handleFileChange,
  handleDrop,
  handleDragOver,
  handleTokenChange,
  createEvent,
  tokenOptions,
}: MultiStepProps) {
  const [steps, setSteps] = useState(1);

  function handlePrev() {
    if (steps > 1) setSteps((steps) => steps - 1);
  }

  function handleNext() {
    if (steps < 4) setSteps((steps) => steps + 1);
  }

  const provider = new ethers.JsonRpcProvider();

  async function readBlock() {
    const blockNumber = await provider.getBlockNumber();
    console.log("Current Block:", blockNumber);

    const balance = await provider.getBalance("vitalik.eth");
    console.log("Vitalik's Balance:", ethers.formatEther(balance), "ETH");
  }

  return (
    <div className={styles.container}>
      <div className={styles.progress_container}>
        {/* <div className={styles.progress}></div> */}
        <Progress totalSteps={totalSteps} steps={steps} />
        <div className={`${styles.circle} ${steps >= 1 ? styles.active : ""}`}>
          1
        </div>
        <div className={`${styles.circle} ${steps >= 2 ? styles.active : ""}`}>
          2
        </div>
        <div className={`${styles.circle} ${steps >= 3 ? styles.active : ""}`}>
          3
        </div>
        <div className={`${styles.circle} ${steps >= 4 ? styles.active : ""}`}>
          4
        </div>
      </div>

      {/* Render step content */}
      <div className={styles.content}>
        {steps === 1 && (
          <EventDetails
            eventData={eventData}
            setEventData={setEventData}
            file={file}
            setFile={setFile}
            preview={preview}
            setPreview={setPreview}
            error={error}
            setError={setError}
            handleFileChange={handleFileChange}
            handleDrop={handleDragOver}
            handleDragOver={handleDragOver}
          />
        )}
        {steps === 2 && (
          <Location eventData={eventData} setEventData={setEventData} />
        )}
        {steps === 3 && (
          <Tickets
            eventData={eventData}
            setEventData={setEventData}
            handleTokenChange={handleTokenChange}
            tokenOptions={tokenOptions}
          />
        )}
        {steps === 4 && (
          <DateTime eventData={eventData} setEventData={setEventData} />
        )}
      </div>

      <div className={styles.btns}>
        <button
          //   className={`${styles.btn} ${styles.disabled}`}
          className={`${steps <= 1 ? styles.disabled : styles.btn}`}
          onClick={handlePrev}
        >
          Prev
        </button>
        {steps < 4 ? (
          <button
            className={`${steps === totalSteps ? styles.disabled : styles.btn}`}
            onClick={handleNext}
          >
            Next
          </button>
        ) : (
          <button
            className={`${steps === totalSteps ? styles.disabled : styles.btn}`}
            onClick={createEvent}
          >
            Create Event
          </button>
        )}
      </div>
    </div>
  );
}
