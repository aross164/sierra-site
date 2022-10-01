import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import EditRankings from './routes/EditRankings';
import Rankings from './routes/Rankings';

const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                path: '/',
                redirect: '/rankings',
                element: <Rankings/>
            },
            {
                path: 'rankings/:week',
                element: <Rankings/>
            },
            {
                path: 'angry',
                element: <EditRankings week={1}/>
            },
            {
                path: 'boring',
                element: <EditRankings week={2}/>
            },
            {
                path: 'cash',
                element: <EditRankings week={3}/>
            },
            {
                path: 'dance',
                element: <EditRankings week={4}/>
            },
        ]
    }
]);

const root = document.getElementById('root');
ReactDOM.render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>, root
);
