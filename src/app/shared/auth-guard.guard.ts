import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppService } from '../service/app.service';

export const authGuardGuard: CanActivateFn = (route, state) => {
  
  const sportiQService=inject(AppService);
  const router=inject(Router);

  if(sportiQService.isLoggedIn()){
    return true;  //allow access
  }
  else{
    router.navigate(['login']);
    return false;
  }
  
};
