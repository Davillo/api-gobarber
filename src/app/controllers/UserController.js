import User from '../models/User';
import * as Yup from 'yup';
import { password } from '../../config/database';
class UserController {

  async store(request, response){

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.email().required(),
      password: Yup.string().required().min(6)
    });

    if(!(await schema.isValid(request.body))){
      return response.status(422).json({error: 'Dados informados são inválidos'})
    }

    const userEmailAlreadyExists = await User.findOne({where: {email : request.body.email}});

    if(userEmailAlreadyExists){
      return response.status(400).json({error: 'O e-mail informado já está sendo utilizado'});
    }

    const {id,name,email,provider} = await User.create(request.body);
    return response.json({id,name,email,provider});
  }

  async update(request, response){

    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
      .min(6)
      .when('oldPassword', (oldPassword, field) =>
        oldPassword ? field.required() : field
      ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      )
    });

    if(!(await schema.isValid(request.body))){
      return response.status(422).json({error: 'Dados informados são inválidos'})
    }

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
