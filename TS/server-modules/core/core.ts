
export const guid = () => {
    function _p8(s) {
        let p = (Math.random().toString(16) + '000000000').substring(2, 10);
        return s ? '-' + p.substring(0, 4) + '-' + p.substring(4, 8) : p
    }
    return _p8(false) + _p8(true) + _p8(true) + _p8(false)
}

export const getPos = (arr, key, v) => { return arr.map(function (e) { return e[key] }).indexOf(v) }

export const sortData = (key, arr) => {
    arr.sort((id) => (a, b) => a[id] === b[id] ? 0 : a[id] < b[id] ? -1 : 1);
}
