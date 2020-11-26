import { select, templates} from './../settings.js';
import AmountWidget from './AmountWidget.js';

class Booking{
  constructor(element){
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();

  }
  render(element){
    const thisBooking = this;

    /* generate HTML by using templates.bookingWidget without any arguments */
    const generatedHTML = templates.bookingWidget();
    /* create empty thisBooking.dom obj */
    thisBooking.dom = {};
    /* save to thisBooking.dom wrapper equal to render() argument 'element' */
    thisBooking.dom.wrapper = element;
    /* generate wrapper HTML from template */
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    /* save to thisBooking.dom.peopleAmount single element found in wrapper and equal to select.booking.peopleAmount */
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    /* save to thisBooking.dom.hoursAmount single element found in wrapper and equal to select.booking.hoursAmount */
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

  }
  initWidgets(){
    const thisBooking = this;

    /*create properties of thisBooking with new AmountWidget(thisBooking.dom.x)*/
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

  }
}
export default Booking; 