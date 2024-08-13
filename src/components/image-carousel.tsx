import React from "react";
import { animate, motion, useMotionValue, Variants } from "framer-motion";
import clsx from "clsx";

interface ImageCarouselProps {
  images: string[];
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const zIndexes = [useMotionValue(2), useMotionValue(1), useMotionValue(0)];
  const [currentImage, setCurrentImage] = React.useState(0);

  const isCurrentImage = (index: number) => index === currentImage;
  const isNextImage = (index: number) => index === (currentImage + 1) % images.length;
  const isLastImage = (index: number) => index === (images.length - 1 + currentImage) % images.length;

  React.useEffect(() => {
    // see https://github.com/framer/motion/issues/1254#issuecomment-920773347 on why this is necessary
    zIndexes.forEach((zIndex, index) => {
      // TODO: zIndexes should be adjusted for n > 3 images
      let targetZIndex = 0; // default - last image
      if (isCurrentImage(index)) targetZIndex = 2;
      if (isNextImage(index)) targetZIndex = 1;

      animate(zIndex, targetZIndex, { type: 'tween', duration: 0.4, onUpdate: (value) => zIndex.set(value) });
    });
  }, [currentImage]);

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
          initial={false}
          custom={index}
          variants={variants}
          animate="animate"
          transition={{ type: 'tween', duration: 0.4 }}
          style={{ zIndex: zIndexes[index] }}
          className={clsx(
            "bg-[#D4CABD] rounded-[10px]",
            "absolute top-0",
            // isCurrentImage(index) && "z-10",
            isLastImage(index) && "right-0",
          )}
        />
      ))}
    </div>
  );
};
