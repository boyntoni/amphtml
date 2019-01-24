/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isLayoutSizeDefined } from '../../../src/layout';
import { removeElement } from '../../../src/dom';
import { userAssert } from '../../../src/log';

class AmpJWPlayer extends AMP.BaseElement {

  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {string} */
    this.contentid_ = '';

    /** @private {string} */
    this.playerid_ = '';

    /** @private {string} */
    this.contentSearch_ = '';

    /** @private {boolean} */
    this.contentContextual_ = false;

    /** @private {string} */
    this.contentRecency_ = '';

    /** @private {boolean} */
    this.contentBackfill_ = false;

    /** @private {?HTMLIFrameElement} */
    this.iframe_ = null;
  }

  /**
   * @param {boolean=} onLayout
   * @override
   */
  preconnectCallback(onLayout) {
    // Host that serves player configuration and content redirects
    this.preconnect.url('https://content.jwplatform.com', onLayout);
    // CDN which hosts jwplayer assets
    this.preconnect.url('https://ssl.p.jwpcdn.com', onLayout);
  }

  /** @override */
  isLayoutSupported(layout) {
    return isLayoutSizeDefined(layout);
  }

  /** @override */
  buildCallback() {
    this.contentid_ = userAssert(
      (this.element.getAttribute('data-playlist-id') ||
        this.element.getAttribute('data-media-id')),
      'Either the data-media-id or the data-playlist-id ' +
      'attributes must be specified for <amp-jwplayer> %s',
      this.element);

    this.playerid_ = userAssert(
      this.element.getAttribute('data-player-id'),
      'The data-player-id attribute is required for <amp-jwplayer> %s',
      this.element);
    
    this.contentSearch_ = this.element.getAttribute('data-content-search') || false;
    this.contentContextual_ = this.element.getAttribute('data-content-contextual') || false;
    this.contentRecency_ = this.element.getAttribute('data-content-recency') || false;
    this.contentBackfill_ = this.element.getAttribute('data-content-backfill') || false;
  }


  /** @override */
  layoutCallback() {
    const iframe = this.element.ownerDocument.createElement('iframe');
    const contentSearch = this.contentSearch_ ? 'search=' + encodeURIComponent(this.contentSearch_) : '';
    const contentContextual = this.contentContextual_ ? 'contextual=' + encodeURIComponent(this.contentContextual_) : '';
    const contentRecency = this.contentRecency_ ? 'recency=' + encodeURIComponent(this.contentRecency_) : '';
    const contentBackfill = this.contentBackfill_ ? 'backfill=' + encodeURIComponent(this.contentBackfill_) : '';
    const contextualParams = [contentSearch, contentContextual, contentRecency, contentBackfill].filter(e => !!e).join('&');
    const qsParams = contextualParams ? '?' + contextualParams : '';
    
    const src = 'https://content.jwplatform.com/players/' +
      encodeURIComponent(this.contentid_) + '-' +
      encodeURIComponent(this.playerid_) + '.html' +
      qsParams;

    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.src = src;
    this.applyFillContent(iframe);
    this.element.appendChild(iframe);
    this.iframe_ = iframe;
    return this.loadPromise(iframe);
  }

  /** @override */
  pauseCallback() {
    if (this.iframe_ && this.iframe_.contentWindow) {
      // The /players page can respond to "play" and "pause" commands from the
      // iframe's parent
      this.iframe_.contentWindow./*OK*/postMessage('pause',
        'https://content.jwplatform.com');
    }
  }

  /** @override */
  unlayoutCallback() {
    if (this.iframe_) {
      removeElement(this.iframe_);
      this.iframe_ = null;
    }
    return true; // Call layoutCallback again.
  }

  /** @override */
  createPlaceholderCallback() {
    if (!this.element.hasAttribute('data-media-id')) {
      return;
    }
    const placeholder = this.win.document.createElement('amp-img');
    this.propagateAttributes(['aria-label'], placeholder);
    placeholder.setAttribute('src', 'https://content.jwplatform.com/thumbs/' +
      encodeURIComponent(this.contentid_) + '-720.jpg');
    placeholder.setAttribute('layout', 'fill');
    placeholder.setAttribute('placeholder', '');
    placeholder.setAttribute('referrerpolicy', 'origin');
    if (placeholder.hasAttribute('aria-label')) {
      placeholder.setAttribute('alt',
        'Loading video - ' + placeholder.getAttribute('aria-label')
      );
    } else {
      placeholder.setAttribute('alt', 'Loading video');
    }
    return placeholder;
  }
}


AMP.extension('amp-jwplayer', '0.1', AMP => {
  AMP.registerElement('amp-jwplayer', AmpJWPlayer);
});
