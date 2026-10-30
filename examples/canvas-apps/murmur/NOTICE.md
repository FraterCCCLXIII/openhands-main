# Notices

Murmur's peer-to-peer storage and replication come from **OrbitDB**, used through the fork
[FraterCCCLXIII/holons-p2p](https://github.com/FraterCCCLXIII/holons-p2p) (package `@orbitdb/core` 3.0.2,
pinned to commit `21731d83f4cb3f70a79a4b117f93e1b9e4b176fa`). OrbitDB is MIT licensed:

    The MIT License (MIT)

    Copyright (c) 2015-2018 Protocol Labs Inc.
    Copyright (c) 2018 Haja Networks Oy

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

The full text is in the fork's [LICENSE](https://github.com/FraterCCCLXIII/holons-p2p/blob/main/LICENSE).

`relay/relay.mjs` is adapted from the circuit-relay server in the same fork (`test/utils/relay.js`).

The bundled `extension.js` also contains other open-source packages, each under its own licence
(MIT or Apache-2.0 / MIT dual): libp2p and its modules, Helia, multiformats, uint8arrays,
`@chainsafe/libp2p-gossipsub`, `@chainsafe/libp2p-noise`, `@chainsafe/libp2p-yamux`, `level` (browser-level),
`events`, `path-browserify`, and `qrcode-generator` (MIT, Kazuhiko Arase). Exact versions are in `package.json`.
