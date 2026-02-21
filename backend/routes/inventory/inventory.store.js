let items = [];

const getItemsStore = () => items;

const setItemsStore = (nextItems) => {
  items = nextItems;
};

module.exports = {
  getItemsStore,
  setItemsStore,
};
