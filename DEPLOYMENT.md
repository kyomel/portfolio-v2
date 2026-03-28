# Astro VPS deployment

This project builds as a static Astro site and is intended to be deployed by GitHub Actions to a VPS running Nginx.

## Repository secrets

Set these GitHub repository secrets before enabling the workflow:

- `SITE_URL`: Your public site URL, for example `https://portfolio.example.com`
- `VPS_HOST`: VPS hostname or IP
- `VPS_PORT`: Optional SSH port, defaults to `22`
- `VPS_USER`: SSH user used for deployment
- `VPS_DEPLOY_PATH`: Optional target directory on the VPS, defaults to `/var/www/portfolio`
- `VPS_SSH_KEY`: Private SSH key for the deploy user

## VPS preparation

Install Nginx and create the deployment directory:

```bash
sudo apt update
sudo apt install -y nginx
sudo adduser deploy
sudo mkdir -p /var/www/portfolio
sudo chown -R deploy:deploy /var/www/portfolio
```

Copy the Nginx template from [deploy/nginx/portfolio.conf](deploy/nginx/portfolio.conf), update `server_name`, and place it at `/etc/nginx/sites-available/portfolio`.

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo nginx -t
sudo systemctl reload nginx
```

For HTTPS, install Certbot and issue a certificate after DNS points to the VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d portfolio.example.com -d www.portfolio.example.com
```

## GitHub Actions deployment

The workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds the site on pushes to `main` and uploads `dist/` to the VPS using `rsync`.

The deploy user must have the matching public key in `~/.ssh/authorized_keys` and write access to `VPS_DEPLOY_PATH`.

## Local production build check

Use the same environment variables locally to validate the generated output:

```bash
SITE_URL=https://portfolio.example.com PUBLIC_SITE_URL=https://portfolio.example.com npm run build
```