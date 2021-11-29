import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {MapService} from './map.service';
import {R6ApiServices} from '../../services/r6api.service';
import {count} from 'rxjs/operators';
import {poi} from '../config.model';

declare const L;
declare const Raphael;

@Injectable({
  providedIn: 'root'
})
export class CalibrateService {
  map;
  referenceLotLayer;
  referenceLot = new Subject();
  lotSummaryList;
  calibratedSvg;

  constructor(
    private r6apiServices: R6ApiServices
  ) {
  }

  removeCalibratedSvg() {
    // this.calibratedSvg
    this.map.removeLayer(this.referenceLotLayer);
  }

  parseSvg(svgconfig, lotsummarylist, map) {
    this.map = map;
    this.map.setZoom(19, {animate: false});
    this.lotSummaryList = lotsummarylist;
    let cc = 0;

    if (!this.lotSummaryList && this.lotSummaryList.length === 0) {
      return;
    }

    const svgBounds = [[svgconfig.neLatBound, svgconfig.neLongBound], [svgconfig.swLatBound, svgconfig.swLongBound]];

    return fetch(svgconfig.svgFileUrl).then(res => {
      return res.text();
    }).then(text => {
      const el = document.getElementById('svg-content');
      el.innerHTML = text;
      const svgAttr = el.firstElementChild.getAttribute('viewBox');

      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgElement.setAttribute('viewBox', svgAttr);
      svgElement.id = 'calibratelots';
      const foundLots = [];

      this.lotSummaryList.forEach(t => {
        const e = t.productname,
          n = document.getElementById('lot_' + e + '_front'),
          i = document.getElementById('lot_' + e + '_left'),
          o = document.getElementById('lot_' + e + '_rear'),
          r = document.getElementById('lot_' + e + '_right');
        if (n && i && o && r) {
          foundLots.push(t);
          const s = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            c = 'g_' + e;
          s.setAttribute('id', c), svgElement.appendChild(s);
          const l = [n, i, o, r];
          for (let t = 0; t < l.length; t += 1) {
            const e = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
              n = c + '_' + t;
            e.setAttribute('id', n), s.appendChild(e);
            const i = l[t];
            if ('path' === i.nodeName) {
              const t = i.getAttribute('d').replace(' ', ','),
                n = (Raphael.getTotalLength(t), Raphael.parsePathString(t)),
                o = [
                  [n[0][1], n[0][2]]
                ];
              let r = o[0];
              for (let t = 1; t < n.length; t += 1) {
                if ('l' === n[t][0]) {
                  const e = [r[0] + n[t][1], r[1] + n[t][2]];
                  r = e, o.push(e);
                }
                if ('L' === n[t][0]) {
                  const e = [n[t][1], n[t][2]];
                  r = e, o.push(e);
                }
                if ('s' === n[t][0] || 'a' === n[t][0] || 'c' === n[t][0]) {
                  const e = 'M' + r[0] + ' ' + r[1] + ',' + n[t].join(' '),
                    i = Raphael.getTotalLength(e),
                    s = i / 5;
                  for (let t = 0; t <= i; t += s) {
                    const n = Raphael.getPointAtLength(e, t);
                    o.push([n.x, n.y]);
                  }
                  const c = Raphael.getPointAtLength(e, i);
                  r = [c.x, c.y], o.push(r);
                }
              }
              o.forEach(t => {
                const n = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                n.setAttribute('cx', t[0]), n.setAttribute('cy', t[1]), n.setAttribute('r', '0'), e.appendChild(n);
              });
            }
            if ('polyline' === i.nodeName) {
              const t = i.getAttribute('points').split(' ');
              for (let n = 0; n < t.length; n += 2) {
                const i = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                i.setAttribute('cx', t[n]), i.setAttribute('cy', t[n + 1]), e.appendChild(i), i.setAttribute('r', '0');
              }
            }
            if ('line' === i.nodeName) {
              const t = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              i.getAttribute('x1'), i.getAttribute('y1'), i.getAttribute('x2'), i.getAttribute('y2');
              t.setAttribute('cx', i.getAttribute('x1')), t.setAttribute('cy', i.getAttribute('y1')), e.appendChild(t), t.setAttribute('r', '0');
              const n = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              n.setAttribute('cx', i.getAttribute('x2')), n.setAttribute('cy', i.getAttribute('y2')), n.setAttribute('r', '0'), e.appendChild(n);
            }
          }
        }
        if (cc += 1, cc === this.lotSummaryList.length) {
          const t = L.svgOverlay(svgElement, svgBounds, {
            interactive: !0
          }).addTo(this.map);
          el.innerHTML = '', this.highlightPaths(foundLots, t);
        }
      });
    });
  }

  highlightPaths(lots, svg) {
    const states = {
        type: 'FeatureCollection',
        features: []
      },
      paneEl = document.getElementsByClassName('leaflet-map-pane')[0],
      paneRect = paneEl.getBoundingClientRect();
    lots.forEach(e => {
      const t = {
        type: 'Feature',
        properties: {
          name: e.productname,
          lotName: e.productname,
          lotCpId: e.lotcpid
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            []
          ]
        }
      };
      if (document.getElementById('g_' + e.productname)) {
        const n = document.getElementById('g_' + e.productname + '_0');
        const o = document.getElementById('g_' + e.productname + '_1');
        const a = document.getElementById('g_' + e.productname + '_2');
        const r = document.getElementById('g_' + e.productname + '_3');
        if (n && o && a && r) {
          [n, o, a, r].forEach(e => {
            const n = e.children;
            for (let e = 0; e < n.length; e++) {
              const o = n[e].getBoundingClientRect(),
                a = L.point(o.x - paneRect.x, o.y - paneRect.y),
                r = this.map.layerPointToLatLng(a);
              t.geometry.coordinates[0].findIndex(e => e[0].toString() === r.lng.toString() && e[1].toString() === r.lat.toString()) < 0 && t.geometry.coordinates[0].push([r.lng, r.lat]);
            }
          }), t.geometry.coordinates[0].push(t.geometry.coordinates[0][0]), states.features.push(t);
        }
      }
    }), states.features.length > 0 ? (this.createFile(states), this.referenceLotLayer = L.geoJSON(states, {
      style: {
        color: '#ff0000',
        weight: 1,
        opacity: .65
      },
      onEachFeature: (e, t) => {
        t.on('click', () => {
          this.referenceLot.next(e);
        });
      }
    }), this.map.addLayer(this.referenceLotLayer), this.map.fitBounds(this.referenceLotLayer.getBounds())) : alert('no reference lot found'), this.map.removeLayer(svg);
  }

  createFile(content) {
    const download = document.createElement('a');
    download.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(content)));
    download.setAttribute('download', 'reference.json');
    download.style.display = 'none';
    document.body.appendChild(download);
    download.click();
    document.body.removeChild(download);
  }

  getReferenceLot() {
    return this.referenceLot;
  }

  calibirateMasterplan(referece) {
    const config = {
      lotName: referece.properties.name,
      geoJson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              type: 'Anchor',
              lotName: referece.properties.name,
            },
            geometry: {
              type: 'Polygon',
              coordinates: referece.geometry.coordinates
            }
          }
        ]
      }
    };
    this.map.removeLayer(this.referenceLotLayer);
    // return config;
    this.r6apiServices.caliberateEstate(config).subscribe(res => {
      console.log(res);
    });
  }
}
