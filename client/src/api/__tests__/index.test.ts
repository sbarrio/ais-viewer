import fetchMock from 'jest-fetch-mock';
import {API_HOST, GET_SHIPS} from '../constants';
import API from '../';
import {BoundingBox, Ship} from '../types';

describe('API', () => {
  const mockBoundingBox: BoundingBox = [
    [28.138073408467264, -15.362252906546672],
    [28.04682051255665, -15.409976996698504],
  ];

  const mockShips: Ship[] = [
    {id: 1, name: 'Ship 1', position: [28.1, -15.3], heading: 0},
    {id: 2, name: 'Ship 2', position: [28.2, -15.4], heading: 90},
  ];

  const mockAPIUrl = `${API_HOST}${GET_SHIPS}?lat1=${mockBoundingBox[0][1]}&lon1=${mockBoundingBox[0][0]}&lat2=${mockBoundingBox[1][1]}&lon2=${mockBoundingBox[1][0]}`;

  describe('getShips', () => {
    beforeEach(() => {
      fetchMock.doMock();
    });

    afterAll(() => {
      fetchMock.disableMocks();
    });

    it('should fetch ships successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 200,
        json: async () => mockShips,
        headers: {
          get: jest.fn().mockReturnValue('new-session-id'),
        },
      } as unknown as Response);

      const ships = await API.getShips(mockBoundingBox);

      expect(ships).toEqual(mockShips);
      expect(API.sessionId).toBe('new-session-id');
      expect(fetchMock).toHaveBeenCalledWith(mockAPIUrl, {
        method: 'GET',
        headers: {
          // No session_id header initially
        },
      });
    });

    it('should handle fetch errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const ships = await API.getShips(mockBoundingBox);

      expect(ships).toEqual([]);
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle non-200 response status', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 400,
        json: async () => ({error: 'Bad request'}),
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as Response);

      const ships = await API.getShips(mockBoundingBox);

      expect(ships).toEqual([]);
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should include session_id in headers if available', async () => {
      API.sessionId = 'existing-session-id';

      fetchMock.mockResolvedValueOnce({
        status: 200,
        json: async () => mockShips,
        headers: {
          get: jest.fn().mockReturnValue('new-session-id'),
        },
      } as unknown as Response);

      const ships = await API.getShips(mockBoundingBox);

      expect(ships).toEqual(mockShips);
      expect(API.sessionId).toBe('new-session-id');
      expect(fetchMock).toHaveBeenCalledWith(mockAPIUrl, {
        method: 'GET',
        headers: {
          session_id: 'existing-session-id',
        },
      });
    });
  });
});
