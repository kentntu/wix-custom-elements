<script setup>
import { reactive, onMounted, watch } from 'vue'
import { Calendar } from 'v-calendar';
import VueMultiselect from 'vue-multiselect';
import Modal from '../Modal/Modal.vue';
import MdInput from '../MdInput/MdInput.vue';

import 'v-calendar/style.css'
import 'vue-multiselect/dist/vue-multiselect.css'
import './md-online-booking.css'

const siteKey = import.meta.env.VITE_RE_CAPTCHA_SITE_KEY
const times = [
  { label: '8:00 AM', value: '08:00' },
  { label: '8:30 AM', value: '08:30' },
  { label: '9:00 AM', value: '09:00' },
  { label: '9:30 AM', value: '09:30' },
  { label: '10:00 AM', value: '10:00' },
  { label: '10:30 AM', value: '10:30' },
  { label: '11:00 AM', value: '11:00' },
  { label: '11:30 AM', value: '11:30' },
  { label: '12:00 PM', value: '12:00' },
  { label: '12:30 PM', value: '12:30' },
  { label: '1:00 PM', value: '13:00' },
  { label: '1:30 PM', value: '13:30' },
  { label: '2:00 PM', value: '14:00' },
  { label: '2:30 PM', value: '14:30' },
  { label: '3:00 PM', value: '15:00' },
  { label: '3:30 PM', value: '15:30' },
  { label: '4:00 PM', value: '16:00' },
  { label: '4:30 PM', value: '16:30' },
  { label: '5:00 PM', value: '17:00' },
  { label: '5:30 PM', value: '17:30' },
]
const today = new Date()
const dfBookingInfo = {
  name: '',
  email: '',
  job_type_names: [],
  drop_off_time: '',
  phone: '',
  boat_name: '',
  registration_number: '',
  make: '',
  model: '',
  year: '',
  note: '',
}

const state = reactive({
  isLoading: false,
  isOpenTimeModal: false,
  isOpenNotificationModal: false,
  notificationMessage: '',
  notificationType: 'info',
  selectedJobTypes: [],
  options: ['list', 'of', 'options'],
  onlineBookingRequestSetup: {},
  selectedDate: today,
  bookingForm: {
    ...dfBookingInfo
  },
  error: {},
  recaptchaErrorMessage: ""
})

const props = defineProps({
  token: String,
  title: String,
  baseUrl: String
})

function selectTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const newDate = new Date(state.selectedDate)
  newDate.setHours(hours)
  newDate.setMinutes(minutes)
  newDate.setSeconds(0)
  state.selectedDate = newDate
  state.isOpenTimeModal = false
}

function handleDayClick(day) {

  const old = state.selectedDate
  const updated = day.date

  updated.setHours(old.getHours())
  updated.setMinutes(old.getMinutes())
  updated.setSeconds(0)

  state.selectedDate = updated

  state.isOpenTimeModal = true
}

function formatDate(date) {
  const d = new Date(date)
  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatTime(date) {
  const minute = date.getMinutes()
  let hour = date.getHours()
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;

  const paddedHour = hour < 10 ? `0${hour}` : `${hour}`;
  const paddedMinute = minute < 10 ? `0${minute}` : `${minute}`;
  return `${paddedHour}:${paddedMinute} ${period}`;
}

function formatSelectedDate(date) {
  const d = new Date(date)
  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

function handleRequestBookingClick() {
  const jobTypeNames = state.selectedJobTypes.map(jobType => jobType.title).filter(Boolean)
  const booking = {
    ...state.bookingForm,
    job_type_names: jobTypeNames,
    drop_off_time: formatSelectedDate(state.selectedDate),
    token: props.token,
    version: 2,
  }
  console.log("Booking data: ", booking)

  if (state.bookingForm.name.length === 0) {
    state.error.name = "Please input name"
  }

  if (state.bookingForm.phone.length === 0) {
    state.error.phone = "Please input phone"
  }

  if (state.bookingForm.email.length === 0 || !isValidEmail(state.bookingForm.email)) {
    state.error.email = "Please input valid email"
  }

  if (!props.token || props.token.length === 0) {
    console.log("Missing online booking token")
    return
  }

  if (Object.keys(state.error).length > 0) {
    return
  }

  if (window.grecaptcha.getResponse().length === 0) {
    state.recaptchaErrorMessage = "Please click the checkbox"
    return
  }

  state.isLoading = true
  const apiBaseUrl = props.baseUrl || import.meta.env.VITE_API_BASE_URL
  fetch(`${apiBaseUrl}/booking_requests/create_booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking),
  })
    .then((response) => {
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      return response.json();
    })
    .then((data) => {
      console.log("Success: ", data)
      state.notificationType = 'info'
      state.notificationMessage = "Thank you for your booking request."
      state.isOpenNotificationModal = true
      state.isLoading = false
      resetForm()
    })
    .catch((error) => {
      console.error('Error:', error);
      state.notificationType = 'error'
      state.notificationMessage = "Something went wrong. Please try again."
      state.isOpenNotificationModal = true
      state.isLoading = false
    });
}

function init() {
  const apiBaseUrl = props.baseUrl || import.meta.env.VITE_API_BASE_URL
  fetch(`${apiBaseUrl}/booking_requests/online_booking_request_setup?token=${props.token}`).then((response) => {
    if (!response.ok) throw new Error('Request failed: ' + response.status);
    return response.json();
  }).then((data) => {
    state.onlineBookingRequestSetup = data
    console.log('online booking request setup:', state.onlineBookingRequestSetup);
  })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

function isCaptchaRendered(containerId) {
  const el = document.getElementById(containerId);
  return !!el && el.querySelector('iframe') !== null;
}

function checkAndRenderCaptcha() {
  if (isCaptchaRendered('g-recaptcha-container')) {
    return
  }

  if (window.grecaptcha?.render && document.getElementById('g-recaptcha-container')) {
    window.grecaptcha.render('g-recaptcha-container', {
      sitekey: siteKey
    })
  } else {
    setTimeout(checkAndRenderCaptcha, 500)
  }

  const src = "https://www.google.com/recaptcha/api.js?render=explicit";
  if (!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}

function resetForm() {
  state.bookingForm = { ...dfBookingInfo }
  state.selectedDate = today
  state.recaptchaErrorMessage = ""
  state.error = {}
  state.selectedJobTypes = []
  window.grecaptcha.reset()
}

function validateData(key, value) {
  if (value.length > 0) {
    if (key === 'email' && !isValidEmail(value)) {
      state.error.email = "Please input valid email"
    } else {
      delete state.error[key]
    }
  } else {
    if (key === 'name') {
      state.error.name = "Please input name"
    } else if (key === 'phone') {
      state.error.phone = "Please input phone"
    } else if (key === 'email') {
      state.error.email = "Please input valid email"
    }
  }
}

watch(() => state.bookingForm.name, (newVal) => {
  validateData('name', newVal)
})

watch(() => state.bookingForm.phone, (newVal) => {
  validateData('phone', newVal)
})

watch(() => state.bookingForm.email, (newVal) => {
  validateData('email', newVal)
})

watch(() => props.token, (newVal) => {
  validateData('token', newVal)

  init()
})

onMounted(() => {
  checkAndRenderCaptcha()
})
</script>

<template>
  <div class="md-online-booking w-full">
    <h3 v-if="title" class="text-2xl font-bold mb-6 text-color">{{ title }}</h3>
    <form novalidate>
      <div class="grid gap-4 mb-4 md:grid-cols-3">
        <MdInput id="name" label="Name" v-model="state.bookingForm.name" required :error-message="state.error.name" />
        <MdInput id="phone" label="Contact Number" v-model="state.bookingForm.phone" required
          :error-message="state.error.phone" />
        <MdInput id="email" label="Email" v-model="state.bookingForm.email" required
          :error-message="state.error.email" />
      </div>

      <div class="mb-4">
        <MdInput id="email" label="Boat name" v-model="state.bookingForm.boat_name" />
      </div>

      <div class="mb-4">
        <div class="block mb-2 text-sm required">
          <label class="text-sm font-medium text-color" for="first_name">Booking Time: </label>
          <span class="text-gray-900 font-bold text-color">&nbsp; {{ formatDate(state.selectedDate) }}</span>
          <span class="text-red-500 font-bold">&nbsp; {{ formatTime(state.selectedDate) }}</span>
        </div>
        <div class="mb-1 custom-v-calendar">
          <Calendar expanded :min-date="today" is-expanded @dayclick="handleDayClick" />
        </div>
        <div class="flex items-center">
          <span class="text-xs text-color required-before">&nbsp; Unselectable days are not available or fully
            booked</span>
        </div>
      </div>

      <div class="mb-4">
        <label for="first_name" class="block mb-2 text-sm font-medium text-color">Services</label>
        <VueMultiselect :multiple="true" v-model="state.selectedJobTypes"
          :options="state.onlineBookingRequestSetup.available_job_types || []" placeholder="" label="title"
          track-by="id" class="custom-multiselect">
        </VueMultiselect>
      </div>

      <div class="grid gap-4 mb-4 md:grid-cols-4">
        <MdInput label="Registration Number" v-model="state.bookingForm.registration_number" />
        <MdInput label="Make" v-model="state.bookingForm.make" />
        <MdInput label="Model" v-model="state.bookingForm.model" />
        <MdInput label="Year" v-model="state.bookingForm.year" />
      </div>

      <div class="mb-4">
        <label for="first_name" class="block mb-2 text-sm font-medium text-color">Note</label>
        <textarea id="message" rows="4" v-model="state.bookingForm.note"
          class="custom-input block p-2.5 text-sm text-gray-900 bg-gray-50  border border-gray-300 focus:ring-blue-500 focus:border-blue-500 w-full"
          placeholder=""></textarea>
      </div>

      <div class="mb-8">
        <div class="google-recaptcha">
          <div id="g-recaptcha-container"></div>
          <p v-if="state.recaptchaErrorMessage" class="text-red-500 text-sm mt-1">
            {{ state.recaptchaErrorMessage }}
          </p>
        </div>
      </div>

      <button type="button" @click="handleRequestBookingClick" :disabled="state.isLoading"
        class="relative flex items-center justify-center gap-2 button-primary text-black bg-white hover:bg-gray-300 font-medium text-sm px-5 py-2.5 me-2 mb-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        <svg v-if="state.isLoading" class="animate-spin h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span>{{ state.isLoading ? 'Processing...' : 'Request a booking' }}</span>
      </button>
    </form>
  </div>

  <Modal title="Select Time" v-model="state.isOpenTimeModal">
    <div class="grid grid-cols-4 gap-4">
      <button v-for="time in times" :key="time.value" @click="selectTime(time.value)"
        class="border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-300 active:bg-gray-200 cursor-pointer">
        {{ time.label }}
      </button>
    </div>
  </Modal>

  <Modal title="Notification" v-model="state.isOpenNotificationModal">
    <span v-if="state.notificationType === 'info'" class="text-md text-sm mb-4 pr-10 primary-color">{{
      state.notificationMessage }}</span>
    <span v-else class="text-md text-sm mb-4 pr-10 text-red-500">{{ state.notificationMessage }}</span>
  </Modal>
</template>