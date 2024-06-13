const parseLineString = (lineString) => {
    const coordinatesPart = lineString.replace('LINESTRING(', '').replace(')', '');
    const coordinatePairs = coordinatesPart.split(',');
    const coordinates = coordinatePairs.map(pair => {
        const [longitude, latitude] = pair.trim().split(' ').map(Number);
        return [latitude, longitude];
    });
    
    return coordinates;
};

module.exports = {
    parseLineString,
}