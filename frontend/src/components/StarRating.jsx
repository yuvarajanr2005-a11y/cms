import React, { useState } from "react";
import { Star } from "lucide-react";

export const StarRating = ({ value = 0, onChange, readOnly = false, size = "w-5 h-5" }) => {
  const [hoverVal, setHoverVal] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hoverVal || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverVal(star)}
            onMouseLeave={() => !readOnly && setHoverVal(0)}
            className={`transition-transform ${!readOnly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
          >
            <Star
              className={`${size} ${
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-600"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
