import React from "react";
import styles from "../styles/MultiStepHome.module.css";

function Progress({ totalSteps, steps, labels }) {
  const progress = ((steps - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={styles.progress_container}>
      {/* Progress bar */}
      <div
        className={styles.progress_background}
        style={{
          height: "4px",
          background: "#ddd",
          width: "100%",
          position: "absolute",
          top: "15px",
          left: 0,
          zIndex: 1,
        }}
      >
        <div
          className={styles.progress_fill}
          style={{
            height: "4px",
            background: "orangered",
            width: `${progress}%`,
            transition: "all 0.4s ease-in",
          }}
        ></div>
      </div>

      {/* Step circles and labels */}
      <div className={styles.steps_with_labels}>
        {labels.map((label, index) => (
          <div key={index} className={styles.step_container}>
            <div
              className={`${styles.circle} ${
                steps >= index + 1 ? styles.active : ""
              }`}
            >
              {index + 1}
            </div>
            <div
              className={`${styles.label} ${
                steps >= index + 1 ? styles.active : ""
              }`}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Progress;
