import { select, templates, settings, classNames } from './../settings.js';
import utils from './../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

export class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.tableSelected = '';
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.bookTable();
    thisBooking.makeReservation();
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };
    //console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking
        + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event
        + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event
        + '?' + params.eventsRepeat.join('&'),
    };
    //console.log('getData urls', urls);


    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),

    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log('bookings', bookings);
        //console.log('eventsCurrent', eventsCurrent);
        //console.log('eventsRepeat', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }
  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }

      }
    }

    //console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDOM();

  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);
    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      //console.log('loop', hourBlock);
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);

    }



  }
  makeReservation() {
    const thisBooking = this;

    thisBooking.dom.submit.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.sendOrder();
    });
  }
  bookTable() {
    const thisBooking = this;

    const tableChosen = thisBooking.dom.wrapper.querySelector(select.booking.tableChosen);


    for (let table of thisBooking.dom.tables) {

      table.addEventListener('click', function (event) {
        event.preventDefault();

        const selectedTable = event.target;

        if (selectedTable.classList.contains(select.booking.tableChosen)) {
          tableChosen.classList.remove(classNames.booking.tableChosen);
          thisBooking.tableSelected = '';
        } else if (table.classList.contains(classNames.booking.tableBooked)) {
          alert('this table is already booked');
          return;
        }
        else {
          for (let table of thisBooking.dom.tables) {
            table.classList.remove(classNames.booking.tableChosen);
          }

          selectedTable.classList.add(classNames.booking.tableChosen);

          thisBooking.tableSelected = selectedTable.getAttribute(settings.booking.tableIdAttribute);
          thisBooking.checkTableData(table);

        }




        console.log('table Selected', thisBooking.tableSelected);
      });
    }

  }
  checkTableData(table) {
    const thisBooking = this;

    //New code for max duration
    const maxDuration = 24 - utils.hourToNumber(thisBooking.hourPicker.value);
    const bookingButton = document.querySelector('#order-btn');
    const thisHour = utils.hourToNumber(thisBooking.hourPicker.value);

    if (thisBooking.hoursAmount.value > maxDuration) {
      console.log('godzina!!!', thisBooking.hoursAmount.value);
      bookingButton.disabled = true;
      alert('booking duration is outside our working hours');
    }

    const tableNumber = table.getAttribute(settings.booking.tableIdAttribute);
    const tableId = parseInt(tableNumber);

    for (let timePeriod = thisHour; timePeriod < thisHour + thisBooking.hoursAmount.value; timePeriod += 0.5) {

      if (thisBooking.booked[thisBooking.date][timePeriod].includes(tableId)) {
        bookingButton.disabled = true;
        alert('THis table is already booked');
        return;
      }
    }
  }
  sendOrder() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const reservation = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: parseInt(thisBooking.tableSelected),
      duration: parseInt(thisBooking.hoursAmount.value),
      ppl: parseInt(thisBooking.peopleAmount.value),
      food: parseInt(thisBooking.foodAmount.value),
      starters: [],
      phone: parseInt(thisBooking.dom.phone.value),
      email: thisBooking.dom.email.value,
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) {
        reservation.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservation),
    };
    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        thisBooking.parsedResponse = {};
        thisBooking.makeBooked(parsedResponse.date, parsedResponse.hour, parsedResponse.duration, parsedResponse.table);
        thisBooking.updateDOM();
        console.log('parsedResponse', parsedResponse);
      });

    console.log('booked', thisBooking.booked);

  }
  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvaliable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvaliable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      console.log('booked', thisBooking.booked);
      if (
        !allAvaliable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

  }



  render(wrapper) {
    const thisBooking = this;

    /* generate HTML by using templates.bookingWidget without any arguments */
    const generatedHTML = templates.bookingWidget();
    /* create empty thisBooking.dom obj */
    thisBooking.dom = {};
    /* save to thisBooking.dom wrapper equal to render() argument 'element' */
    thisBooking.dom.wrapper = wrapper;
    /* generate wrapper HTML from template */
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    /* save to thisBooking.dom.peopleAmount single element found in wrapper and equal to select.booking.peopleAmount */
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.foodAmount = thisBooking.dom.wrapper.querySelector(select.booking.foodAmount);
    /* save to thisBooking.dom.hoursAmount single element found in wrapper and equal to select.booking.hoursAmount */
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.submit = thisBooking.dom.wrapper.querySelector(select.booking.bookTable);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.email = thisBooking.dom.wrapper.querySelector(select.cart.address);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.cart.phone);

  }
  initWidgets() {
    const thisBooking = this;

    /*create properties of thisBooking with new AmountWidget(thisBooking.dom.x)*/
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.foodAmount = new AmountWidget(thisBooking.dom.foodAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    


    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

  }
}
export default Booking; 