import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        {/* Outer lens ring */}
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            border: "2.5px solid #fafafa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 4,
            marginBottom: 4,
          }}
        >
          {/* Lens pupil */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: "#fafafa",
            }}
          />
        </div>
        {/* Handle */}
        <div
          style={{
            position: "absolute",
            width: 10,
            height: 2.5,
            background: "#fafafa",
            borderRadius: 2,
            transform: "rotate(45deg)",
            right: 4,
            bottom: 6,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
