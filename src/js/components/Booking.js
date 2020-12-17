import { select, templates} from './../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

export class Booking {
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

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

  }
  initWidgets(){
    const thisBooking = this;

    /*create properties of thisBooking with new AmountWidget(thisBooking.dom.x)*/
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

  }
}
export default Booking; 