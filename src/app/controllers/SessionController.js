import User from '../models/User';
import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';

class SessionController {
  async store(request, response){
    const {email,password} = request.body;

    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6)
    });

    if(!(await schema.isValid(request.body))){
      return response.status(400).json({error: 'Dados informados são inválidos'})
    }

    const user = await User.findOne({where: {email}});

    if(!user || !(await user.checkPassword(password))){
      return response.status(401).json({error: 'Usuário ou senha inválidos'})
    }

    const {id,name} = user;
    return response.json(
    {
      user: {
        id,name,email
      },
      token: jwt.sign({id}, authConfig.secret, {
        expiresIn: authConfig.expiresIn,

      })
    })
  }
}

export default new SessionController();
