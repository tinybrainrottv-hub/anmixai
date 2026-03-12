"use client";

import React from "react";
import styled from "styled-components";

type UpgradeGlowButtonProps = {
  onClick?: () => void;
};

const UpgradeGlowButton: React.FC<UpgradeGlowButtonProps> = ({ onClick }) => {
  return (
    <StyledWrapper onClick={onClick}>
      <div className="area">
        <div className="bg">
          <div className="light-1" />
          <div className="light-2" />
          <div className="light-3" />
        </div>
        <label className="area-wrapper">
          <div className="wrapper">
            <input defaultChecked type="checkbox" readOnly />
            <button className="button" type="button">
              <div className="part-1">
                <div className="case">
                  <div className="mask" />
                  <div className="line" />
                </div>
                <div className="screw">
                  {/* trimmed inner SVGs for brevity */}
                </div>
              </div>
              <div className="part-2">
                <div className="glass">
                  <span className="content">
                    <span className="text state-1">
                      {"GetStarted".split("").map((ch, i) => (
                        <span key={i} data-label={ch} style={{ ["--i" as any]: i + 1 }}>
                          {ch}
                        </span>
                      ))}
                    </span>
                  </span>
                </div>
              </div>
            </button>
          </div>
        </label>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .area {
    --ease-elastic: cubic-bezier(0.5, 2, 0.3, 0.8);
    --primary: #ff8800;
    --rounded-max: 100px;
    --rounded-min: 10px;
    --h: 60px;

    display: flex;
    align-items: center;
    justify-content: flex-start;
    position: relative;
    transform: scale(0.7);
    transform-origin: left center;
  }

  .area-wrapper {
    position: relative;
    padding: 10px 0;
    cursor: pointer;
  }

  .wrapper {
    display: block;
    border-radius: 100px;
    position: relative;
    z-index: 2;
    transform: translateY(-4px) scale(1.02);
  }

  .wrapper input {
    position: absolute;
    opacity: 0;
    inset: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .button {
    background: transparent;
    display: flex;
    border: none;
    padding: 0;
    margin: 0;
  }

  .part-1 {
    position: relative;
    z-index: 1;
    height: var(--h);
    width: 80px;
    border-radius: var(--rounded-max) var(--rounded-min) var(--rounded-min)
      var(--rounded-max);
  }

  .part-2 {
    position: relative;
    height: var(--h);
    width: 180px;
    border-radius: var(--rounded-min) var(--rounded-max) var(--rounded-max)
      var(--rounded-min);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .glass {
    position: relative;
    overflow: hidden;
    height: 100%;
    width: 100%;
    border-radius: inherit;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(0, 0, 0, 0.5) 100%
    );
  }

  .content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .text {
    display: flex;
    gap: 2px;
  }

  .text span {
    position: relative;
    color: transparent;
  }

  .text span::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
  }
`;

export { UpgradeGlowButton };


