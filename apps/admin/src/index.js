const app = firebase.initializeApp({
  apiKey: 'AIzaSyA9BtOR-U15YjkWksOyzx329ExQF4vjiVc',
  authDomain: 'hotel-trinserhof.firebaseapp.com',
  databaseURL: 'https://hotel-trinserhof-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'hotel-trinserhof',
  storageBucket: 'hotel-trinserhof.appspot.com',
  messagingSenderId: '610796710348',
  appId: '1:610796710348:web:eaa0c623aa77451ae1d569',
  measurementId: 'G-FYXT53SHJQ',
});

const auth = firebase.auth(app);

var provider = new firebase.auth.GoogleAuthProvider();

const database = firebase.database();

const dateString = function (date) {
  return date.toISOString().split('T').join(' ');
};

const getAmountOfNights = (from, to) => {
  if (!from) return 0;
  if (!to) return 0;

  const startMillis = new Date(from).getTime();
  const endMillis = new Date(to).getTime();
  const millisDifference = endMillis - startMillis;
  const daysDifference = millisDifference / (1000 * 60 * 60 * 24);
  return Math.round(daysDifference);
};

const groups = [
  { id: 'Algemein' },
  { id: 101 },
  { id: 102 },
  { id: 103 },
  { id: 104 },
  { id: 106 },
  { id: 107 },
  { id: 108 },
  { id: 109 },
  { id: 110 },
  { id: 111 },
  { id: 112 },
  { id: 113 },
  { id: 114 },
  { id: 116 },
  { id: 117 },
  { id: 118 },
  { id: 119 },
  { id: 121 },
  { id: 124 },
  //   { id: 'Jenn' },
  //   { id: 'Jess' },
  //   { id: 'Jesse' },
  //   { id: 'Harry' },
  //   { id: 125 },
  //   { id: 126 },
  //   { id: 127 },
  //   { id: 129 },
];

var newItem = {
  content: '',
  group: groups[0],
  start: new Date(),
  price: 0,
  status: 'confirmed',
};

var visGroups = new vis.DataSet(groups);
var container = document.getElementById('timeline');
var timeline = new vis.Timeline(container);

let formatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

async function prettyPrompt(title, item, callback) {
  const { value } = await Swal.fire({
    // title: title,
    html: `
        <div class='form'>
          <div>
            <label for="swal-input-group">Zimmer</label>
            <input id="swal-input-group" class="swal2-input" value="${
              item.group
            }" placeholder="Zimmer" disabled>
          </div>
          <div>
            <label for="swal-input-content">Name</label>
            <input id="swal-input-content" class="swal2-input" value="${
              item.content
            }" placeholder="Name">
          </div>
          <div>
            <label for="swal-input-name">Beschreibung</label>
            <input id="swal-input-name" class="swal2-input" value="${
              item.name
            }" placeholder="Beschreibung">
          </div>
          <div>
            <label for="swal-input-contact">Kontakt</label>
            <input id="swal-input-contact" class="swal2-input" value="${
              item.contact
            }" placeholder="Telefon / Email">
          </div>
          <div>
            <label for="swal-input-price">Preis</label>
            <input id="swal-input-price" class="swal2-input" value="${
              item.price
            }" placeholder="Preis">
          </div>
          <div>
            <label for="swal-input-status">Status</label>
            <select id="swal-input-status" class="swal2-input swal2-select">
              <option value="confirmed" ${
                item.status === 'confirmed' ? 'selected' : ''
              }><div class='icon confirmed'></div>Bestätigt</option>
              <option value="maybe" ${
                item.status === 'maybe' ? 'selected' : ''
              }><div class='icon maybe'></div>Vielleicht</option>
              <option value="employee" ${
                item.status === 'employee' ? 'selected' : ''
              }><div class='icon employee'></div>Mitarbeiter</option>
            </select>
          </div>

          ${
            item.created &&
            `<div><label>Erstellt</label><div>${formatter.format(
              new Date(item.created),
            )}</div></div>`
          }
          ${
            item.updated &&
            `<div><label>Aktualisiert</label><div>${formatter.format(
              new Date(item.updated),
            )}</div></div>`
          }
        </div>
      `,
    preConfirm: () => {
      return {
        content: document.getElementById('swal-input-content').value,
        name: document.getElementById('swal-input-name').value,
        contact: document.getElementById('swal-input-contact').value,
        price: document.getElementById('swal-input-price').value,
        status: document.getElementById('swal-input-status').value,
      };
    },
    showCancelButton: true,
    confirmButtonColor: '#5d5bd8',
  });
  callback(value);
}

const showTimeline = function (bookings) {
  if (!bookings) {
    bookings = {};
  }

  const bookingIds = Object.keys(bookings);

  const visBookings = bookingIds.map((id) => {
    const booking = bookings[id];

    if (!booking.group) {
      booking.group = 101;
    }
    if (!booking.id) {
      booking.id = id;
    }
    if (!booking.price || booking.price === 'undefined') {
      booking.price = 0;
    }

    const start = new Date(booking.start);
    const end = new Date(booking.end);
    if (!['Algemein', 'Jenn', 'Jess', 'Jesse', 'Harry'].includes(booking.group)) {
      start.setHours(15);
      end.setHours(9);
    }

    const classNames = [booking.group];
    if (booking.deleted) {
      classNames.push('deleted');
    }
    if (booking.status) {
      classNames.push(booking.status);
    }
    if (booking.hide) {
      classNames.push('hide');
    }

    return {
      id: id,
      created: booking.created ? booking.created : dateString(new Date()),
      updated: booking.updated ? booking.updated : dateString(new Date()),
      group: booking.group,
      start: start,
      end: end,
      content: booking.content ?? '',
      name: booking.name ?? '...',
      contact: booking.contact ?? '',
      deleted: booking.deleted ? true : false,
      status: booking.status ?? 'maybe',
      price: booking.price ?? 0,
      className: classNames.join(' '),
    };
  });

  [2023, 2024, 2025, 2026, 2027].map((year) => {
    visBookings.push({
      content: 'Closed (spring)',
      start: `${year}-04-01`,
      end: `${year}-05-31`,
      type: 'background',
    });
    visBookings.push({
      content: 'Closed (autumn)',
      start: `${year}-09-01`,
      end: `${year}-12-20`,
      type: 'background',
    });
  });

  var items = new vis.DataSet(visBookings.filter((b) => !b.deleted));

  timeline.setItems(items);
  document.getElementById('loader').style.display = 'none';

  items.on('add', function (event, properties, item) {
    database.ref(`bookings/${properties.items[0]}`).set({
      id: properties.items[0],
      ...newItem,
      start: dateString(newItem.start),
      end: dateString(newItem.end),
      created: dateString(new Date()),
      updated: dateString(new Date()),
      deleted: false,
    });
  });

  items.on('update', function (event, properties) {
    const now = new Date();
    const item = properties.data[0];
    database.ref(`bookings/${item.id}`).set({
      ...item,
      start: dateString(item.start),
      end: dateString(item.end),
      updated: dateString(new Date()),
    });
  });

  items.on('remove', function (event, properties) {
    const item = properties.oldData[0];
    const now = new Date();
    database.ref(`bookings/${item.id}`).set({
      ...item,
      start: dateString(item.start),
      end: dateString(item.end),
      updated: dateString(new Date()),
      deleted: true,
    });
  });
};

async function fetchData() {
  try {
    document.getElementById('loader').style.display = 'flex';
    const bookingsRef = database.ref('bookings');
    bookingsRef.on('value', async function (snapshot) {
      var bookings = await snapshot.val();
      showTimeline(bookings);
    });
  } catch (error) {
    console.error(error);
  }
}

const loadTimeline = function (editable = false) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 2);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 1);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  timeline.setOptions({
    groupOrder: function (a, b) {
      return a.id - b.id;
    },
    editable,
    format: {
      minorLabels: {
        millisecond: 'SSS',
        second: 's',
        minute: 'HH:mm',
        hour: 'HH:mm',
        weekday: 'ddd D',
        day: 'D',
        week: 'w',
        month: 'MMM',
        year: 'YYYY',
      },
    },
    margin: {
      item: 6,
    },
    locale: 'de',
    horizontalScroll: true,
    verticalScroll: true,
    zoomKey: 'ctrlKey',
    orientation: 'top',
    showMinorLabels: true,
    stack: true,
    groupHeightMode: 'fixed',
    start: startDate,
    end: endDate,
    min: minDate,
    max: maxDate,
    // zoomMin: 1000 * 60 * 60 * 24 * 7, // It will not be possible to zoom in further than this minimum.
    // zoomMax: 1000 * 60 * 60 * 24 * 20, // It will not be possible to zoom out further than this maximum.
    width: '90%',
    showWeekScale: true,

    template: function (item, element, data) {
      const content = [];
      content.push(item.content);
      return content.join(' - ');
    },
    visibleFrameTemplate: function (item) {
      const additionalData = [];

      if (
        item.description?.toLowerCase().includes('airbnb') ||
        item.name?.toLowerCase().includes('airbnb')
      ) {
        additionalData.push(
          editable
            ? "<img src='../airbnb.svg' height='12' />"
            : "<img src='./airbnb.svg' height='12' />",
        );
      }

      const amountOfNights = getAmountOfNights(item.start, item.end);
      additionalData.push(`${amountOfNights} ${amountOfNights === 1 ? 'night' : 'nights'}.`);

      if (item.name && item.name !== 'undefined') {
        additionalData.push(item.name);
      }
      if (item.price) {
        additionalData.push(`€ ${item.price}`);
      }
      if (item.contact && item.contact !== 'undefined') {
        additionalData.push(`- ${item.contact}`);
      }
      if (additionalData.length > 0) {
        return `<span>${additionalData.join(' ')}</span>`;
      }
      return null;
    },
    onAdd: function (item, callback) {
      prettyPrompt(
        'Add',
        { ...item, content: '', name: '', contact: '', price: 0 },
        function (res) {
          if (res) {
            newItem.content = res.content;
            newItem.name = res.name;
            newItem.contact = res.contact;
            newItem.price = res.price;
            newItem.status = res.status;
            callback({
              ...item,
              ...res,
            });
          }
          return false;
        },
      );
    },
    onUpdate: function (item, callback) {
      prettyPrompt('Update', item, function (res) {
        if (res) {
          callback({
            ...item,
            ...res,
          });
        }
        return false;
      });
    },
  });

  timeline.setGroups(groups);

  document.getElementById('today').onclick = function () {
    timeline.moveTo(new Date());
  };
  document.getElementById('zoomout').onclick = function () {
    timeline.zoomOut(1);
  };
  document.getElementById('zoomin').onclick = function () {
    timeline.zoomIn(1);
  };

  timeline.on('mouseDown', function (properties) {
    newItem.group = properties.group;
    newItem.start = new Date(properties.snappedTime._i);
    newItem.end = new Date(properties.snappedTime._i);
    newItem.end = new Date(newItem.end.setDate(properties.snappedTime._i.getDate() + 1));
  });
};

const start = async function (editable = false) {
  await fetchData();
  await loadTimeline(editable);
};
