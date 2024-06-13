import {API_HOST, GET_SHIPS} from './constants';
import {BoundingBox, Ship} from './types';

class API {
  sessionId: string | undefined;

  async getShips(boundingBox: BoundingBox): Promise<Ship[]> {
    try {
      const response = await fetch(
        `${API_HOST}${GET_SHIPS}?lat1=${boundingBox[0][1]}&lon1=${boundingBox[0][0]}&lat2=${boundingBox[1][1]}&lon2=${boundingBox[1][0]}`,
        {
          method: 'GET',
          headers: {
            ...(this.sessionId && {session_id: this.sessionId}),
          },
        },
      );

      if (response.status === 200) {
        const shipDataJson = await response.json();
        this.sessionId = response.headers.get('session_id') || undefined;
        return shipDataJson;
      } else {
        const errorData = await response.json();
        console.error(response.status, errorData);
        return [];
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}

export default new API();
