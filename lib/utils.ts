export const getComputedHeightWidth = (
  windowWidth: number,
  windowHeight: number,
  videoWidth: number,
  videoHeight: number
): { width: number; height: number } => {
  if (
    windowHeight === 0 ||
    windowWidth === 0 ||
    videoHeight === 0 ||
    videoWidth === 0
  ) {
    return {
      width: 0,
      height: 0
    };
  }
  let calcHeight = (windowWidth * videoHeight) / videoWidth;
  if (calcHeight > windowHeight) {
    let newWindowWidth = windowWidth;
    while (calcHeight > windowHeight) {
      newWindowWidth -= 1;
      calcHeight = (newWindowWidth * videoHeight) / videoWidth;
    }
    return {
      width: newWindowWidth,
      height: calcHeight
    };
  }
  return {
    width: windowWidth,
    height: calcHeight
  };
};

export const getFormattedTime = (currentTime: number) => {
  return formatString(
    `${Math.floor(currentTime / 3600)}:${Math.floor(
      (currentTime % 3600) / 60
    )}:${Math.floor((currentTime % 3600) % 60)}`
  );
};

const formatString = (str: string) => {
  const splits = str.split(':');

  for (let i = 0; i < splits.length; i++) {
    splits[i] = splits[i].length === 1 ? `0${splits[i]}` : splits[i];
  }

  return splits.join(':');
};
