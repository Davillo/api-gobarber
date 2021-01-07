import Appointment from '../models/Appointment';
import User from '../models/User';
import * as Yup from 'yup';

class AppointmentController {

  async store(request, response){
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required()
    });
    const isInvalid = !(await schema.isValid(request.body));

    if(isInvalid){
      return response.status(422).json({error: 'Validation fails'});
    }

   const {provider_id, date} = request.body;

  /**
   * check if provider_id is a provider
  */
  const isProvider = await User.findOne({
    where: {id: provider_id, provider: true}
  });

  if(!isProvider){
    return response.status(400).json({error: 'You can only create appointments with a valid provider'});
  }

  const appointment = await Appointment.create({
    user_id: request.userId,
    provider_id,
    date
  });

  return response.json(appointment);
}

}

export default new AppointmentController();
