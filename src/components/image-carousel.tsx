import React from "react";
import { animate, motion, useMotionValue, Variants } from "framer-motion";
import clsx from "clsx";
import { useWidth } from "~/hooks/use-media";

interface ImageCarouselProps {
  images: string[];
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [initial, setInitial] = React.useState(true);
  const [zi, setZi] = React.useState([2, 1, 0]);
  const [currentImage, setCurrentImage] = React.useState(0);
  const width = useWidth();

  const isCurrentImage = (index: number) => index === currentImage;
  const isNextImage = (index: number) => index === (currentImage + 1) % images.length;
  const isLastImage = (index: number) => index === (images.length - 1 + currentImage) % images.length;

  React.useEffect(() => {
    if (initial) {
      setInitial(false);
      return;
    }

    const timeoutFirst = setTimeout(() => {
      setZi((prev) => {
        const [two, one, zero] = prev;
        return [zero, two, one];
      });
    }, 375);

    return () => {
      clearTimeout(timeoutFirst);
    }
  }, [currentImage]);

  const next = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  }

  const primaryWidth = width >= 1024 ? 1134 : 378;
  const secondaryWidth = width >= 1024 ? 807 : 268;
  const slideDistance = (primaryWidth - secondaryWidth) * 1.2;

  const offset = width >= 1024 ? 60 : 20;

  const variants: Variants = {
    animate: (index) => {
      // when image is "becoming" the current image
      if (isCurrentImage(index)) return {
        x: [null, -slideDistance, 0],
        width: primaryWidth,
      };
      // when image is "becoming" the next or last image
      return {
        x: isNextImage(index) ? -offset : [null, slideDistance, offset],
        width: secondaryWidth,
        top: "50%",
        y: "-50%"
      };
    }
  };

  return (
    <div
      data-testid="carousel"
      onClick={next}
      className="relative w-[378px] h-[212px] lg:w-[1137px] lg:h-[727px]"
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
          transition={{
            duration: 0.8,
            ease: [0.43, 0.13, 0.23, 0.96], // Similar to easeInOut but smoother
          }}
          style={{ zIndex: zi[index] }}
          className={clsx(
            "bg-[#D4CABD] rounded-md lg:rounded-[10px]",
            "absolute top-0",
            isLastImage(index) && "right-0",
          )}
        />
      ))}
    </div>
  );
};
