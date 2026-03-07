// src/services/alertService.ts
import Swal from 'sweetalert2';

export class AlertService {
  static success(title: string, message?: string) {
    return Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Aceptar'
    });
  }

  static error(title: string, message?: string) {
    return Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Aceptar'
    });
  }

  static warning(title: string, message?: string) {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Aceptar'
    });
  }

  static confirm(title: string, text: string, confirmButtonText: string = 'Sí, eliminar') {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText,
      cancelButtonText: 'Cancelar'
    });
  }

  static loading(title: string = 'Cargando...') {
    return Swal.fire({
      title,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  static close() {
    Swal.close();
  }
}

export default AlertService;