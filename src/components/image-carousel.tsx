import React from "react";
import { animate, motion, useMotionValue, Variants } from "framer-motion";
import clsx from "clsx";

const variants: Variants = {
  animate: (index) => {
    if (index === 1) return { x: 0, height: 727, width: 1134 };
    if (index === 2) return {
      x: [null, 400, 60],
      height: 515,
      width: 807,
      transition: { type: 'tween', duration: 0.4 },
    };

    return { x: -60, height: 515, width: 807 };
  }
};

// TODO: Simplify this mess
export const ImageCarousel = () => {
  const zIndexes = [useMotionValue(0), useMotionValue(1), useMotionValue(0)];
  const [currentCycle, setCurrentCycle] = React.useState(0);

  const next = () => {
    setCurrentCycle((prev) => (prev + 1) % 3);
  };

  React.useEffect(() => {
    zIndexes.forEach((zIndex, index) => {
      let targetZIndex = index === Math.abs(currentCycle - 1) ? 1 : 0;
      if (currentCycle === 2) targetZIndex = index === currentCycle ? 1 : 0;

      animate(zIndex, targetZIndex, { type: 'tween', duration: 0.3, onUpdate: (value) => zIndex.set(value) });
    });
  }, [currentCycle]);

  return (
    <motion.div
      onClick={next}
      className="relative w-[1134px] h-[750px] flex items-center"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.img
          src={`/assets/product/product-slide-${index + 1}.png`}
          key={index}
          initial={false}
          className="absolute w-[1100px] h-[750px]"
          style={{ zIndex: zIndexes[index] }}
          animate="animate"
          variants={variants}
          custom={(index + currentCycle) % 3}
        />
      ))}
    </motion.div>
  );
};

interface ImageCarouselProps {
  images: string[];
}

export const NewImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentImage, setCurrentImage] = React.useState(0);

  const isCurrentImage = (index: number) => index === currentImage;
  const isNextImage = (index: number) => index === (currentImage + 1) % images.length;
  const isLastImage = (index: number) => index === (images.length - 1 + currentImage) % images.length;

  const next = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  }

  const variants: Variants = {
    animate: (index) => {
      if (isCurrentImage(index)) return { x: 0, width: 1137 };
      return {
        x: isNextImage(index) ? -60 : [null, 400, 60],
        width: 807,
        top: "50%",
        y: "-50%"
      };
    }
  };

  return (
    <div
      onClick={next}
      className="relative lg:w-[1137px] lg:h-[781px]"
    >
      {images.map((src, index) => (
        <motion.img
          key={src}
          src={src}
          alt=""
          custom={index}
          variants={variants}
          animate="animate"
          transition={{ type: 'tween', duration: 0.4 }}
          className={clsx(
            "bg-[#D4CABD] rounded-[10px]",
            "absolute top-0",
            isCurrentImage(index) && "z-10",
            isLastImage(index) && "right-0",
          )}
        />
      ))}
    </div>
  );
};
