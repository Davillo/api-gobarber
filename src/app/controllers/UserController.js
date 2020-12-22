import User from '../models/User';

class UserController {

  async store(request, response){
    const userEmailAlreadyExists = await User.findOne({where: {email : request.body.email}});

    if(userEmailAlreadyExists){
      return response.status(400).json({error: 'O e-mail informado já está sendo utilizado'});
    }

    const {id,name,email,provider} = await User.create(request.body);
    return response.json({id,name,email,provider});
  }

  async update(request, response){
    console.log(request.userId);
    return response.json();
  }



}

export default new UserController();
