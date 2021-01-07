import User from '../models/User';
import File from '../models/File';

class ProviderController {

  async index (request, response){
    const providers = await User.findAll({
      where: {provider: true},
      limit: 10,
      attributes: ['id', 'name','email'],
      include: [
        {
          model: File,
          as: 'file',
          attributes: ['url', 'name','path']
        }
      ]
    });

    return response.json(providers);
  }
}

export default new ProviderController();
