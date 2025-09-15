import React from "react";
import styles from "../styles/MultiStepHome.module.css";

function Progress({ totalSteps, steps }) {
  const progress = ((steps - 1) / (totalSteps - 1)) * 100;
  return (
    <div
      className={styles.progress}
      style={{
        height: "4px",
        background: "#ddd",
        width: "100%",
        transition: "all 0.4s ease-in",
      }}
    >
      <div
        className={styles.progress}
        style={{
          height: "4px",
          background: "#43766c",
          width: `${progress}%`,
          transition: "all 0.4s ease-in",
        }}
      ></div>
    </div>
  );
}

export default Progress;
