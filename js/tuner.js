'use strict'


const USER_MEDIA_CONSTRAINTS = {
  audio: {
    mandatory: {
      googEchoCancellation: 'false',
      googAutoGainControl: 'false',
      googNoiseSuppression: 'false',
      googHighpassFilter: 'false',
    },
    optional: [],
  },
}
const FFT_SIZE = 2048

//import { USER_MEDIA_CONSTRAINTS, FFT_SIZE } from './constants.js'


// Implements modified ACF2+ algorithm
// Source: https://github.com/cwilso/PitchDetect
const autoCorrelate = (buf, sampleRate) => {
  // Not enough signal check
  const RMS = Math.sqrt(buf.reduce((acc, el) => acc + el ** 2, 0) / buf.length)
  if (RMS < 0.001) return NaN

  const THRES = 0.2
  let r1 = 0
  let r2 = buf.length - 1
  for (let i = 0; i < buf.length / 2; ++i) {
    if (Math.abs(buf[i]) < THRES) {
      r1 = i
      break
    }
  }
  for (let i = 1; i < buf.length / 2; ++i) {
    if (Math.abs(buf[buf.length - i]) < THRES) {
      r2 = buf.length - i
      break
    }
  }

  const buf2 = buf.slice(r1, r2)
  const c = new Array(buf2.length).fill(0)
  for (let i = 0; i < buf2.length; ++i) {
    for (let j = 0; j < buf2.length - i; ++j) {
      c[i] = c[i] + buf2[j] * buf2[j + i]
    }
  }

  let d = 0
  for (; c[d] > c[d + 1]; ++d);

  let maxval = -1
  let maxpos = -1
  for (let i = d; i < buf2.length; ++i) {
    if (c[i] > maxval) {
      maxval = c[i]
      maxpos = i
    }
  }
  let T0 = maxpos

  let x1 = c[T0 - 1]
  let x2 = c[T0]
  let x3 = c[T0 + 1]
  let a = (x1 + x3 - 2 * x2) / 2
  let b = (x3 - x1) / 2

  return sampleRate / (a ? T0 - b / (2 * a) : T0)
}
//import { autoCorrelate } from './algorithm.js'


const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const CONCERT_PITCH = 440 //frequency of a fixed note, which is used as a standard for tuning. It is usually a standard (also called concert) pitch of 440 Hz, which is called A440 or note A in the one-line (or fourth) octave (A4)
const MIDI = 69 // the MIDI note number of A4
const A = 2 ** (1 / 12) // the twelth root of 2 = the number which when multiplied by itself 12 times equals 2 = 1.059463094359...
const C0_PITCH = 16.35 // frequency of lowest note: C0

const getDataFromFrequency = (frequency) => {
  const N = Math.round(12 * Math.log2(frequency / CONCERT_PITCH)) // the number of half steps away from the fixed note you are. If you are at a higher note, n is positive. If you are on a lower note, n is negative.
  const Fn = CONCERT_PITCH * A ** N // the frequency of the note n half steps away of concert pitch
  const noteIndex = (N + MIDI) % 12 // index of note letter from NOTES array
  const octave = Math.floor(Math.log2(Fn / C0_PITCH))

  return {
    frequency,
    note: NOTES[noteIndex],
    noteFrequency: Fn,
    deviation: frequency - Fn,
    octave,
  }
}

//import getDataFromFrequency from './getDataFromFrequency.js'

const freelizer = async () => {
  let rafID
  let audioContext
  let analyser
  let callbacks = []

  const init = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(
      USER_MEDIA_CONSTRAINTS
    )
    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = FFT_SIZE
    audioContext.createMediaStreamSource(stream).connect(analyser)
  }

  const update = () => {
    const buffer = new Float32Array(FFT_SIZE)
    analyser.getFloatTimeDomainData(buffer)
    const frequency = autoCorrelate(buffer, audioContext.sampleRate)
    callbacks.forEach((fn) =>
      fn(frequency ? getDataFromFrequency(frequency) : {})
    )
    rafID = requestAnimationFrame(update)
  }

  await init()

  return {
    start: () => update(),
    stop: () => cancelAnimationFrame(rafID),
    subscribe: (fn) => (callbacks = [...callbacks, fn]),
    unsubscribe: (fn) => (callbacks = callbacks.filter((el) => el !== fn)),
  }
}


module.exports = freelizer;