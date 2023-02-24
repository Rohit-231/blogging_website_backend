
class APIFeatures{
  constructor(query,queryString){
    this.query=query;
    this.queryString=queryString;
  }

  filter(){
    //BUILD QUERY
    // 1A Filtering
    const queryObj = {...this.queryString};
    const excludedFields = ['page', 'sort', 'limit','fields']
    excludedFields.forEach(el => delete queryObj[el])
    
    // 1B Advanced Filtering
    // { duration: { gte: '' } } before conversion
    // { duration: { $gte: '' } }  after conversion ie this works in mongoDB
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    console.log(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr))
    return this;
  }

  sort(){
    if(this.queryString.sort){
      const sortBy = this.queryString.sort.split(',').join(' ')
      this.query=this.query.sort(sortBy)
    }else{
      this.query=this.query.sort('-created_at')
    }

    return this;
  }

  limitFields(){
    if(this.queryString.fields){
      const fields=this.queryString.fields.split(',').join(' ')
      this.query= this.query.select(fields)
    }else{
      this.query= this.query.select('-__v') // - sign excludes the field __v
    }
    return this;
  }

  paginate(){
    const page= this.queryString.page*1 || 1;
    const limit=this.queryString.limit*1 || 100;
    const skip = (page-1)*limit;

    this.query=this.query.skip(skip).limit(limit); //skip does the sjkipping of documents of DB

    return this;
  }
}

module.exports=APIFeatures