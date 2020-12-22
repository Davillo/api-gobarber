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
    const {email, oldPassword} = request.body;
    const user = await User.findByPk(request.userId);

    if(email !== user.email){
      const userEmailAlreadyExists = await User.findOne({where: {email : request.body.email}});

      if(userEmailAlreadyExists){
        return response.status(400).json({error: 'O e-mail informado já está sendo utilizado'});
      }
    }

    if(oldPassword && !(await user.checkPassword(oldPassword))){
      return response.status(401).json({error: 'Senhas não conferem'})
    }

    const {id,name,provider} = await user.update(request.body);

    return response.json({id,name,email,provider});
  }



}

export default new UserController();
