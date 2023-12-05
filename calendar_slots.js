function getCalendarSlots() {
  var calendar = CalendarApp.getDefaultCalendar();
  var timeZone = calendar.getTimeZone();
  var now = new Date();
  var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0); // Tomorrow at 9 AM
  var end = new Date(start);
  end.setDate(end.getDate() + 7 - end.getDay() + 6); // Through the next complete week
  end.setHours(17, 0, 0, 0); // Until 5 PM of the last day

  var events = calendar.getEvents(start, end);
  var slots = findFreeSlots(events, start, end, timeZone);

  writeSlotsToSheet(slots);
}

function findFreeSlots(events, start, end, timeZone) {
  var slots = [];
  var lastEnd = null;

  // Convert start and end times to EST
  var est = Session.getScriptTimeZone();
  var businessStartHour = 8;
  var businessEndHour = 18.5; // 5:30 PM

  for (var time = new Date(start); time < end; time.setMinutes(time.getMinutes() + 30)) {
    if (time.getDay() === 0 || time.getDay() === 6) continue; // Skip weekends

    // Convert time to EST for business hours comparison
    var estTime = new Date(time);
    estTime = Utilities.formatDate(estTime, est, 'HH:mm');
    var estHours = parseFloat(estTime.split(':')[0]) + parseFloat(estTime.split(':')[1]) / 60;

    // Skip times outside of business hours
    if (estHours < businessStartHour || estHours + 0.5 > businessEndHour) continue;

    var slotStart = new Date(time);
    var slotEnd = new Date(time.getTime() + 30 * 60 * 1000); // 30 minutes later

    var isFree = events.every(event => {
      var eventStart = event.getStartTime();
      var eventEnd = event.getEndTime();
      return slotEnd <= eventStart || slotStart >= eventEnd;
    });

    if (isFree) {
      if (lastEnd && lastEnd.getTime() === slotStart.getTime()) {
        slots[slots.length - 1].end = slotEnd;
      } else {
        slots.push({ start: slotStart, end: slotEnd });
      }
      lastEnd = slotEnd;
    }
  }

  return slots;
}

function writeSlotsToSheet(slots) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var cell = sheet.getActiveRange();
  var timeZoneET = 'America/New_York';

  var filteredSlots = slots.filter(slot => slot.end.getTime() - slot.start.getTime() >= 60 * 60 * 1000);
  var data = filteredSlots.map(slot => {
    var dayStr = Utilities.formatDate(slot.start, timeZoneET, 'EEE MM/dd');
    var startStrET = formatTime(slot.start, timeZoneET);
    var endStrET = formatTime(slot.end, timeZoneET);
    var etSlot = `${dayStr} ${startStrET}-${endStrET} ET`;

    // Subtract 3 hours for PT time
    var startStrPT = formatTime(new Date(slot.start.getTime() - 3 * 60 * 60 * 1000));
    var endStrPT = formatTime(new Date(slot.end.getTime() - 3 * 60 * 60 * 1000));
    var ptSlot = `${startStrPT}-${endStrPT} PT`;

    return [`${etSlot} / ${ptSlot}`];
  });

  if (data.length > 0) {
    sheet.getRange(cell.getRow(), cell.getColumn(), data.length, 1).setValues(data);
  } else {
    sheet.getRange(cell.getRow(), cell.getColumn()).setValue('No free slots found');
  }
}

function formatTime(date, timeZone) {
  if (timeZone) {
    date = new Date(Utilities.formatDate(date, timeZone, 'MM/dd/yyyy HH:mm:ss'));
  }
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var period = hours >= 12 ? 'pm' : 'am';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  if (hours < 0) hours += 24; // Adjust for negative hours when converting to PT
  var minutesStr = minutes === 0 ? '' : (minutes < 10 ? ':0' : ':') + minutes;
  return hours + minutesStr + period;
}

function getTimeZoneAbbreviation(timeZone) {
  var abbreviations = {
    'America/New_York': 'ET',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'America/Phoenix': 'MST',
    'America/Los_Angeles': 'PT',
    'America/Anchorage': 'AKT',
    'Pacific/Honolulu': 'HT',
    // Add other mappings as needed
  };
  return abbreviations[timeZone] || timeZone;
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Calendaring')
    .addItem('Get Calendar Slots', 'getCalendarSlots')
    .addToUi();
}
