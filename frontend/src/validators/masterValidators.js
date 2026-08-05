import * as yup from 'yup';

export function buildMasterSchema(config) {
  const shape = {
    name_tamil: yup.string().trim().required('தமிழ் பெயர் தேவை').max(150, 'அதிகபட்சம் 150 எழுத்துகள்'),
    name_english: yup.string().trim().required('ஆங்கில பெயர் தேவை').max(150, 'அதிகபட்சம் 150 எழுத்துகள்'),
    sort_order: yup
      .number()
      .typeError('எண் தேவை')
      .integer('முழு எண் தேவை')
      .min(0, '0 அல்லது அதற்கு மேல் இருக்க வேண்டும்')
      .default(0),
    is_active: yup.boolean().default(true),
  };

  if (config.type === 'hierarchical') {
    shape[config.parentColumn] = yup
      .number()
      .typeError(`${config.parentLabelTa} தேவை`)
      .required(`${config.parentLabelTa} தேவை`);
  }

  if (config.type === 'event') {
    shape.event_date = yup.string().nullable();
    shape.venue = yup.string().trim().nullable().max(255, 'அதிகபட்சம் 255 எழுத்துகள்');
  }

  return yup.object(shape);
}
