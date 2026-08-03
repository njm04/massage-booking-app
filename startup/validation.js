import Joi from "joi";
import JoiObjectId from "joi-objectid";

export default () => {
  Joi.objectId = JoiObjectId(Joi);
};
