import React from "react";
import { AnimatePresence, domAnimation, LazyMotion, m, Variants } from "framer-motion";
import clsx from "clsx";
import { useWidth } from "~/hooks/use-media";
import { shiftOrder, swapOneAndZero } from "~/utils/shift-and-swap";

const INITIAL_ZI_STATE = [2, 1, 0];

interface ImageCarouselProps {
  images: string[];
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [initial, setInitial] = React.useState(true);
  const [zi, setZi] = React.useState(INITIAL_ZI_STATE);
  const [currentImage, setCurrentImage] = React.useState(0);
  const width = useWidth();
  const isDesktop = width >= 1024;

  const isCurrentImage = (index: number) => index === currentImage;
  const isNextImage = (index: number) => index === (currentImage + 1) % images.length;

  const next = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  React.useEffect(() => {
    // Automatically cycle through images
    const interval = setInterval(next, 5000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    if (initial) {
      setInitial(false);
      return;
    }

    // context: https://github.com/framer/motion/issues/1254#issuecomment-920773347


    // To prevent the next image from flickering while the current becomes the last,
    // we first make the last image zIndex above the next image. We then swap the last and next image
    // after a delay to prevent flickering.

    const timeoutFirst = setTimeout(() => {
      setZi((prev) => {
        const shifted = shiftOrder(prev);
        return swapOneAndZero(shifted);
      });
    }, 375);

    const timeoutSecond = setTimeout(() => {
      const original = [
        [2, 1, 0],
        [0, 2, 1],
        [1, 0, 2],
      ];
      const swappables = original.map(swapOneAndZero);
      // Only swap if it has been previously swapped
      const isSwapped = (order: number[]) => swappables.some((swappable) => swappable.every((v, i) => v === order[i]));

      setZi((prev) => {
        if (isSwapped(prev)) return swapOneAndZero(prev);
        return prev;
      });
    }, 375 * 2); // trigger after the first timeout

    return () => {
      clearTimeout(timeoutFirst);
      clearTimeout(timeoutSecond);
    }
  }, [currentImage]);

  const primaryWidth = isDesktop ? 760 : 378;
  const secondaryWidth = isDesktop ? 541 : 268;
  const slideDistance = (primaryWidth - secondaryWidth) * 1.2;

  const offset = isDesktop ? 60 : 20;

  const variants: Variants = {
    animate: (index) => {
      // "becoming" the current image
      if (isCurrentImage(index)) {
        return {
          x: [null, -slideDistance, 0],
          width: primaryWidth,
        };
      }

      // "becoming" the next image
      if (isNextImage(index)) {
        return {
          x: -offset,
          width: secondaryWidth,
          top: "50%",
          y: "-50%",
        };
      }

      // "becoming" the last image
      return {
        x: [null, slideDistance * 1.6, slideDistance],
        width: secondaryWidth,
        top: "50%",
        y: "-50%"
      };
    }
  };

  return (
    <div
      data-testid="carousel"
      className="relative w-[378px] h-[212px] lg:w-[762px] lg:h-[487px]"
    >
      <LazyMotion features={domAnimation}>
        <AnimatePresence initial={false}>
          {images.map((src, index) => (
            <m.img
              key={index}
              src={src}
              alt=""
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
              )}
            />
          ))}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
};
