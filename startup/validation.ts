import Joi from "joi";
import JoiObjectId from "joi-objectid";

export default () => {
  (Joi as any).objectId = JoiObjectId(Joi);
};
