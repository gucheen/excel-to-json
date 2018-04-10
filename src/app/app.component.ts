import { Component, OnInit } from '@angular/core';
import { HotTableRegisterer } from '@handsontable/angular';
import { ClipboardService } from 'ngx-clipboard';

enum Root {
  Object,
  Array,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  instance = 'hot';
  root = Root.Array;
  result: Object | Array<any> = [];
  availableRoots = Root;
  groupBy = '';
  groupKey = 'value';
  groupValueIsNumber = false;
  ignoreHeaderRow = true;
  mapRules = '';

  constructor(
    private hotRegisterer: HotTableRegisterer,
    private clipboard: ClipboardService,
  ) {
  }

  onHotChange() {
    if (this.hot) {
    }
  }

  rootChange() {
    switch (this.root) {
      case Root.Object:
        this.result = {};
        break;
      case Root.Array:
        this.result = [];
        break;
      default:
    }
  }

  dump() {
    const groupBy = this.groupBy.trim();
    if (groupBy.length) {
      this.dumpWithGroup(groupBy);
      return;
    }
    this.dumpDirectly();
  }

  dumpWithGroup(groupBy) {
    if (!/^[rc]\d+$/.test(groupBy)) {
      return;
    }
    let groups = [];
    const mapRules = this.mapRules.split('\n').map(rule => rule.split('->'));
    if (groupBy.startsWith('c')) {
      const colIndex = Number.parseInt(groupBy.substr(1), 10) - 1;
      groups = this.getHotData()
        .reduce((previous, row) => {
          if (row.some(cell => cell)) {
            const cellValue = row[colIndex];
            if (typeof previous[cellValue] !== 'object') {
              previous[cellValue] = {};
            }
            if (!mapRules.length) {
              return;
            }
            mapRules.forEach((rule) => {
              const index = Number.parseInt(rule[0], 10) - 1;
              const key = rule[1];
              if (!index) {
                return;
              }
              if (!Array.isArray(previous[cellValue][key])) {
                previous[cellValue][key] = [];
              }
              previous[cellValue][key].push(Number.parseInt(row[index], 10));
            });
          }
          return previous;
        }, {});
    }
    this.result = Object.keys(groups).map((key) => {
      return {
        [this.groupKey]: this.groupValueIsNumber ? Number.parseFloat(key) : key,
        ...groups[key],
      };
    });
  }

  dumpDirectly() {
    const mapRules = this.mapRules.split('\n').map(rule => rule.split('->'));
    if (this.root === Root.Object) {
      if (mapRules[0][0][0].startsWith('c')) {
        //  abc
      }
      this.result = this.getHotData()
        .reduce((previous, row) => {
          if (row.some(cell => cell)) {
            mapRules.forEach((rule) => {
              const index = Number.parseInt(rule[0].substr(1)) - 1;
              const key = rule[1];
              if (!Number.isInteger(index)) {
                return;
              }
              if (!Array.isArray(previous[key])) {
                previous[key] = [];
              }
              previous[key].push(row[index]);
            });
          }
          return previous;
        }, {});
    } else if (this.root === Root.Array) {
      this.result = this.getHotData()
        .reduce((previous, row) => {
          if (row.some(cell => cell)) {
            const obj = {};
            mapRules.forEach((rule) => {
              const index = Number.parseInt(rule[0].substr(1)) - 1;
              const key = rule[1];
              if (!Number.isInteger(index)) {
                return;
              }
              obj[key] = row[index];
            });
            previous.push(obj);
          }
          return previous;
        }, []);
    }
  }

  get hot() {
    return this.hotRegisterer.getInstance(this.instance);
  }

  getHotData() {
    const data = this.hot.getData();
    return this.ignoreHeaderRow ? data.slice(1) : data;
  }

  copy() {
    this.clipboard.copyFromContent(JSON.stringify(this.result));
  }

  ngOnInit() {

  }
}
