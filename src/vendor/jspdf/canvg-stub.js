const disabledMessage =
  'jsPDF optional SVG rendering support was removed to ship less legacy client code.';

const canvgStub = {
  fromString() {
    throw new Error(disabledMessage);
  },
};

export default canvgStub;