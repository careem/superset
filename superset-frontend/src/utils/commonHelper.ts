export const removeUnnecessaryProperties = (object:Object,properties:Array<string>) =>
{
  Object.keys(object).forEach(key =>
    {
      if(properties.includes(key)){
        delete object[key]}
    }
    )
}