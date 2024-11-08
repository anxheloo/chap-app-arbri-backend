const filterObject = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((item) => {
    if (allowedFields.includes(item)) newObj[item] = obj[item];
  });

  return newObj;
};

module.exports = filterObject;
