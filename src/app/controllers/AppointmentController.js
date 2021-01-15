import Appointment from '../models/Appointment';
import {startOfHour, parseISO, isBefore, format, subHours} from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import * as Yup from 'yup';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {

  async index(request, response){
    const {page = 1} = request.query;

    const appointments = await Appointment.findAll({
      where: {user_id: request.userId, canceled_at: null},
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'date', 'past','cancelable'],
      include: [
       {
        model: User,
        as: 'provider',
        attributes: ['id', 'name'],
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path','url']
          }
        ]
       }
      ]
    });

    return response.json(appointments);
  }

  async store(request, response){
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required()
    });

    const isValid = await schema.isValid(request.body);

    if(!isValid){
      return response.status(422).json({error: 'Validation fails'});
    }

    if(request.userId === provider_id){
      return response.status(422).json({error: 'It is not possible to create an appointment for the same user as provider'});
    }

    const {provider_id, date} = request.body;

    /**
     * check if provider_id is a provider
    */
    const provider = await User.findOne({
      where: {id: provider_id, provider: true}
    });

    if(!provider){
      return response.status(422).json({error: 'You can only create appointments with a valid provider'});
    }

    /**
     * Check for paste dates
     */
    const hourStart = startOfHour(parseISO(date));

    if(isBefore(hourStart, new Date())){
      return response.status(422).json({error: 'Past dates are not permitted'});
    }



    /**
     * check date availability
     */
    const checkAvailability = await Appointment.findOne({
      where:{
        provider_id,
        canceled_at: null,
        date: hourStart
      }
    });

    if(checkAvailability){
      return response.status(422).json({error: 'Appointment date is not available'});
    }

    const appointment = await Appointment.create({
      user_id: request.userId,
      provider_id,
      date: hourStart
    });

    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      {locale: pt}
    );

    /**
     * Provider notification
     */
    await Notification.create({
      content: `Novo agendamento de ${provider.name} para ${formattedDate}`,
      user: provider_id
    });

    return response.json(appointment);
  }

  async destroy(request, response){
    const appointment = await Appointment.findByPk(request.params.id,{
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['name']
        }
      ]
    });

    if(appointment.user_id !== request.userId){
      return response.status(401).json({
        error: "You don't have permission to cancel this appointment"
      });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if(isBefore(dateWithSub, new Date())){
      return response.status(401).json({
        error: 'You can oly cancel appointments with 2 hours in advance'
      });
    }

    appointment.canceled_at = new Date();
    await appointment.save();

    await Queue.add(CancellationMail.key, {
      appointment
    });

    return response.json(appointment);
  }
}

export default new AppointmentController();
