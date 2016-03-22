/**
 * Save as Image (dialog box)
 *
 * Handles interaction on the "Save as image" dialog box.
 * Instantiates an instance of Dialog
 * Exports nothing
 *
 */
/* global street, settings, _saveSettingsLocally, _normalizeSlug, _getStreetImage */
'use strict'

var Dialog = require('./dialog')
import { trackEvent } from '../app/event_tracking'

// Require save-as polyfills
var saveAs = require('../vendor/FileSaver')
require('../vendor/canvas-toBlob.js')
require('../vendor/Blob.js')

// Cached references to elements
var _elTransparentSky
var _elSegmentNames
var _elStreetName
var _elPreviewLoading
var _elPreviewPreview
var _elDownloadLink
var _imageCanvas

module.exports = new Dialog('#save-as-image-dialog', {
  clickSelector: '#save-as-image',
  onInit: function () {
    _elTransparentSky = this.el.querySelector('#save-as-image-transparent-sky')
    _elSegmentNames = this.el.querySelector('#save-as-image-segment-names')
    _elStreetName = this.el.querySelector('#save-as-image-street-name')
    _elPreviewLoading = this.el.querySelector('#save-as-image-preview-loading')
    _elPreviewPreview = this.el.querySelector('#save-as-image-preview-preview')
    _elDownloadLink = this.el.querySelector('#save-as-image-download')

    _elTransparentSky.addEventListener('change', _updateSaveAsImageOptions)
    _elSegmentNames.addEventListener('change', _updateSaveAsImageOptions)
    _elStreetName.addEventListener('change', _updateSaveAsImageOptions)

    _elDownloadLink.addEventListener('click', _downloadImage)
  },
  onShow: function () {
    _elTransparentSky.checked = settings.saveAsImageTransparentSky
    _elSegmentNames.checked = settings.saveAsImageSegmentNamesAndWidths
    _elStreetName.checked = settings.saveAsImageStreetName

    _elPreviewLoading.classList.add('visible')
    _elPreviewPreview.classList.remove('visible')

    window.setTimeout(_updateSaveAsImageDialogBox, 100)

    // Tracking
    trackEvent('Sharing', 'Save as image', null, null, false)
  }
})

// 'Private' functions

function _updateSaveAsImageDialogBox () {
  _elPreviewLoading.classList.add('visible')
  _elPreviewPreview.classList.remove('visible')

  window.setTimeout(_updateSaveAsImageDialogBoxPart2, 50)
}

function _updateSaveAsImageDialogBoxPart2 () {
  _elPreviewPreview.innerHTML = ''

  _imageCanvas = _getStreetImage(settings.saveAsImageTransparentSky, settings.saveAsImageSegmentNamesAndWidths, settings.saveAsImageStreetName)
  var dataUrl = _imageCanvas.toDataURL('image/png')

  var imgEl = document.createElement('img')
  imgEl.addEventListener('load', _saveAsImagePreviewReady)
  imgEl.src = dataUrl
  _elPreviewPreview.appendChild(imgEl)

  _elDownloadLink.download = _makeFilename() // Not supported in Safari/iOS
  _elDownloadLink.href = dataUrl // Link should refer to data URL, even though
                                 // _downloadImage() is used for direct download
}

function _saveAsImagePreviewReady () {
  _elPreviewLoading.classList.remove('visible')
  _elPreviewPreview.classList.add('visible')
}

function _updateSaveAsImageOptions () {
  settings.saveAsImageTransparentSky = _elTransparentSky.checked
  settings.saveAsImageSegmentNamesAndWidths = _elSegmentNames.checked
  settings.saveAsImageStreetName = _elStreetName.checked

  _saveSettingsLocally()

  window.setTimeout(_updateSaveAsImageDialogBox, 0)
}

/**
 *  When download links is clicked, converts the dataURL to a blob for download
 *  Designed to get around a limitation in IE where a dataURL is not downloadable directly (https://msdn.microsoft.com/en-us/library/cc848897(v=vs.85).aspx)
 */
function _downloadImage (event) {
  event.preventDefault()
  _imageCanvas.toBlob(function (blob) {
    var filename = _makeFilename()
    saveAs(blob, filename)
  })
}

function _makeFilename () {
  var filename = _normalizeSlug(street.name)
  if (!filename) {
    filename = 'street'
  }
  filename += '.png'

  return filename
}
